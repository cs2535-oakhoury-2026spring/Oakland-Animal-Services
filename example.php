<?php

require_once(ABSPATH . '/vendor/autoload.php');
require_once(__DIR__ . '/RescueGroupsCache.php');

use GuzzleHttp\Middleware;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;

// https://wordpress.stackexchange.com/questions/269736/add-last-modified-time-as-version-to-css-and-js
function enqueue_no_cache($my_handle, $uri, $type='script', $my_deps=array()) {
	$logger = get_logger();
	$theme_file_path = str_replace(get_stylesheet_directory_uri(), '', $uri);
	$theme_abs_path = get_theme_file_path($theme_file_path);
    $vsn = filemtime($theme_abs_path);
    if($type == 'script') wp_enqueue_script($my_handle, $uri, $my_deps, $vsn);
    else if($type == 'style') wp_enqueue_style($my_handle, $uri, $my_deps, $vsn);      
}

function get_logger() {
	$log = new Logger('wordpress-logs');
	$log->pushHandler(new StreamHandler(ABSPATH . 'oas-debug.log'));
	return $log;
}

//========================= RESCUEGROUPS API CLIENT ======================
// ================= caching layer ==================

/**
 * Check if RescueGroups cache is enabled
 * Priority order:
 * 1. RG_CACHE_ENABLED environment variable (if set)
 * 2. RG_CACHE_ENABLED constant from wp-config.php (if defined)
 * 3. Default to false
 * 
 * @return bool True if cache is enabled, false otherwise
 */
function is_rescuegroups_cache_enabled() {
	// First priority: environment variable
	$env_value = getenv('RG_CACHE_ENABLED');
	if ($env_value !== false) {
		$env_lower = strtolower(trim($env_value));
		return in_array($env_lower, ['1', 'true', 'yes', 'on']);
	}
	
	// Second priority: wp-config.php constant
	if (defined('RG_CACHE_ENABLED')) {
		return (bool) RG_CACHE_ENABLED;
	}
	
	// Default: disabled
	return false;
}

// Global cache instance
function get_rescuegroups_cache() {
	static $cache = null;
	if ($cache === null) {
		$cache = new RescueGroupsCache();
	}
	return $cache;
}

/**
 * Handle RescueGroups API exceptions with cache fallback
 * 
 * @param Exception $e The exception that was caught
 * @param string $endpoint The API endpoint that was called
 * @param array $jsonBody The request body that was sent
 * @param string $context Context string for logging (function name)
 * @param mixed $default_return Default value to return if cache miss
 * @return mixed Cached data if available, otherwise default_return
 */
function handle_rescuegroups_exception($e, $endpoint, $jsonBody, $context, $default_return = null) {
	$logger = get_logger();
	// $logger->info(var_export($e, true));
	$logger->info("Error in {$context}: {$e->getMessage()}");
	
	// Try to serve from cache on exception (if cache is enabled)
	if (is_rescuegroups_cache_enabled()) {
		$cache = get_rescuegroups_cache();
		$cached_data = $cache->readCache($endpoint, $jsonBody);
		
		if ($cached_data !== null) {
			$logger->warning("API exception caught, serving from cache. context: {$context}");
			return $cached_data;
		}
		
		$logger->error("API exception and no cache available. context: {$context}");
	} else {
		$logger->info("Cache disabled, not attempting cache fallback. context: {$context}");
	}
	
	return $default_return;
}

// ================= helpers ==================
function get_rescuegroups_client() {
	$client = new GuzzleHttp\Client([
		'base_uri' => 'https://api.rescuegroups.org',
		'timeout'  => 10.0,
		// 'http_errors' => false
	]);
	return $client;
}

function get_rescuegroups_json($response) {
	$statuscode = $response->getStatusCode();
	// $logger->info("status is {$statuscode}");
	if ($statuscode >= 200 && $statuscode < 300) {
		$jsonString = $response->getBody();
		$animal = json_decode($jsonString, true);		
		return $animal;
	} else {
		$logger->info("Error: API returned {$statuscode}");
		$logger->info($response-getRequest()->getUrl());
	}
	return null;
}

function get_journals($animal_id) {
	$logger = get_logger();
	$client = get_rescuegroups_client();
	$token = getenv('RG_TOKEN');
	$tokenHash = getenv('RG_TOKEN_HASH');
	$filters = [
		[
			'fieldName' => 'journalEntryAnimalID',
			'operation' => 'equals',
			'criteria' => $animal_id
		],
		[
			'fieldName' => 'journalEntrytypeDescription',
			'operation' => 'equals',
			'criteria' => [
				'Foster Notes', 
				'Foster Summary', 
				'In-Shelter Summary', 
				'Field Trip Notes', 
				'Medical Condition', 
				'Volunteer Notes', 
				'Bite Disclosure',
				'DogToDog Eval',
				'Handling Eval',
				'history',
				'CatToCat',
				'petpoint-foster-notes'
			]
		],
	];
	$fields = ['journalEntryComment', 'journalEntryDate', 'journalEntryID', 'journalEntrytypeDescription'];
	$jsonBody = [
		'token' => $token,
		'tokenHash' => $tokenHash,
		'objectType' => 'animalsJournalEntries',
		'objectAction' => 'search',
		'search' => [
			'resultStart' => 0,
			'resultLimit' => 100,
			'resultSort' => 'journalEntryDate',
			'resultOrder' => 'desc',
			'filters' => $filters,
			'fields' => $fields
		]
	];

	$endpoint = '/http/v2.json';
	
	try {
		$response = $client->request('POST', $endpoint, [
			'json' => $jsonBody
		]);
		$out = handle_rescuegroups_response($response, $logger, 'get_journals', $endpoint, $jsonBody);
		return $out;
	} catch (Exception $e) {
		return handle_rescuegroups_exception($e, $endpoint, $jsonBody, 'get_journals', null);
	}
}

function get_handling_evals_for_animals($animal_ids) {
	$logger = get_logger();
	$client = get_rescuegroups_client();
	$token = getenv('RG_TOKEN');
	$tokenHash = getenv('RG_TOKEN_HASH');
	
	// If no animal IDs provided, return empty array
	if (empty($animal_ids)) {
		return [];
	}
	
	$filters = [
		[
			'fieldName' => 'journalEntryAnimalID',
			'operation' => 'equals',
			'criteria' => $animal_ids
		],
		[
			'fieldName' => 'journalEntrytypeDescription',
			'operation' => 'equals',
			'criteria' => 'Handling Eval'
		],
	];
	$fields = ['journalEntryComment', 'journalEntryDate', 'journalEntryID', 'journalEntrytypeDescription', 'journalEntryAnimalID'];
	$jsonBody = [
		'token' => $token,
		'tokenHash' => $tokenHash,
		'objectType' => 'animalsJournalEntries',
		'objectAction' => 'search',
		'search' => [
			'resultStart' => 0,
			'resultLimit' => 1000, // Increased limit to handle multiple animals
			'resultSort' => 'journalEntryDate',
			'resultOrder' => 'desc',
			'filters' => $filters,
			'fields' => $fields
		]
	];

	$endpoint = '/http/v2.json';
	
	try {
		$response = $client->request('POST', $endpoint, [
			'json' => $jsonBody
		]);
		$result = handle_rescuegroups_response($response, $logger, 'get_handling_evals_for_animals', $endpoint, $jsonBody);
	} catch (Exception $e) {
		$result = handle_rescuegroups_exception($e, $endpoint, $jsonBody, 'get_handling_evals_for_animals', []);
		if ($result === []) {
			return [];
		}
	}
	
	// Organize results by animal ID, keeping only the latest handling eval per animal
	$organized_results = [];
	if ($result && is_array($result)) {
		foreach ($result as $journal_entry) {
			$animal_id = $journal_entry['journalEntryAnimalID'];
			
			// Only keep the first (most recent) handling eval for each animal
			if (!isset($organized_results[$animal_id])) {
				$organized_results[$animal_id] = $journal_entry;
			}
		}
	}

	return $organized_results;
}

function get_medical_conditions_for_animals($animal_ids) {
	$logger = get_logger();
	$client = get_rescuegroups_client();
	$token = getenv('RG_TOKEN');
	$tokenHash = getenv('RG_TOKEN_HASH');
	
	// If no animal IDs provided, return empty array
	if (empty($animal_ids)) {
		return [];
	}
	
	$filters = [
		[
			'fieldName' => 'journalEntryAnimalID',
			'operation' => 'equals',
			'criteria' => $animal_ids
		],
		[
			'fieldName' => 'journalEntrytypeDescription',
			'operation' => 'equals',
			'criteria' => 'Medical Condition'
		],
	];
	$fields = ['journalEntryComment', 'journalEntryDate', 'journalEntryID', 'journalEntrytypeDescription', 'journalEntryAnimalID'];
	$jsonBody = [
		'token' => $token,
		'tokenHash' => $tokenHash,
		'objectType' => 'animalsJournalEntries',
		'objectAction' => 'search',
		'search' => [
			'resultStart' => 0,
			'resultLimit' => 1000, // Increased limit to handle multiple animals
			'resultSort' => 'journalEntryDate',
			'resultOrder' => 'desc',
			'filters' => $filters,
			'fields' => $fields
		]
	];

	$endpoint = '/http/v2.json';
	
	try {
		$response = $client->request('POST', $endpoint, [
			'json' => $jsonBody
		]);
		$result = handle_rescuegroups_response($response, $logger, 'get_medical_conditions_for_animals', $endpoint, $jsonBody);
	} catch (Exception $e) {
		$result = handle_rescuegroups_exception($e, $endpoint, $jsonBody, 'get_medical_conditions_for_animals', []);
		if ($result === []) {
			return [];
		}
	}
	
	// Organize results by animal ID - an animal can have multiple medical conditions
	// so we'll store all of them in an array per animal
	$organized_results = [];
	if ($result && is_array($result)) {
		foreach ($result as $journal_entry) {
			$animal_id = $journal_entry['journalEntryAnimalID'];
			
			// Store all medical conditions for each animal
			if (!isset($organized_results[$animal_id])) {
				$organized_results[$animal_id] = [];
			}
			$organized_results[$animal_id][] = $journal_entry;
		}
	}

	return $organized_results;
}

function search_animals($filters, $limit, $view = 'full', $sort_key = 'animalID', $sort_dir = 'asc', $fields_override = null) {

	if (!isset($filters)) {
		return null;
	}

	$logger = get_logger();
	$client = get_rescuegroups_client();
	$apikey = getenv('RG_API_KEY');
	$token = getenv('RG_TOKEN');
	$tokenHash = getenv('RG_TOKEN_HASH');

	$fields = [];
	if ($view == 'full') {
		$fields = [
			'animalName',
			'animalDescription',
			'animalBreed',
			'animalGeneralAge',
			'animalRescueID',
			'animalSummary',
			'animalSex',
			'animalAltered',
			'animalGeneralSizePotential',
			'animalColorDetails',
			'animalOKWithCats',
			'animalOKWithDogs',
			'animalOKWithKids',
			'animalPictures',
			'animalVideoUrls',
			'animalStatus',
			"animalSpecies",
			'animalID',
			'animalNeedsFoster',
			"animalSizeCurrent",
			"animalSizePotential",
			'animalSponsorable',
			'animalPlayful', // regularly attends playgroups
			"animalEagerToPlease" // mapped to "has video in cloudfront"
		];
	} else if ($view == 'matchmaker_full') {
		$fields = [
			'animalName',
			'animalDescription',
			'animalBreed',
			'animalGeneralAge',
			'animalRescueID',
			'animalSummary',
			'animalSex',
			'animalGeneralSizePotential',
			'animalColorDetails',
			'animalPictures',
			'animalVideoUrls',
			'animalStatus',
			"animalSpecies",
			'animalID',
			'animalOrigin',
			'animalOthernames',
			'animalDistinguishingMarks',
			'animalSpecialneedsDescription',
			'animalNotes',
			'animalSizeCurrent',
			'animalSizePotential',
			'animalNotHousetrainedReason',
			'animalPlayful',
			'animalAdoptionFee',
			'animalAltered',
			'animalNeedsFoster',
			'animalCondition',

			// new categories
			'animalEnergyLevel',
			'animalOKWithKids',
			'animalOlderKidsOnly',
			'animalOKWithCats',
			'animalOKWithDogs',
			'animalNoSmallDogs',
			'animalOwnerExperience',
			'animalEagerToPlease',
			"animalDeclawed", // mapped to "can live with other dogs" 
			"animalYardRequired" // mapped to "can be adopted alone (for kittens/cats)"
		];
	} else if ($view == 'search') {
		$fields = [
			'animalName',
			'animalBreed',
			'animalGeneralAge',
			'animalRescueID',
			'animalSummary',
			'animalSex',
			'animalGeneralSizePotential',
			'animalColorDetails',
			'animalVideoUrls',
			'animalThumbnailUrl',
			'animalID',
			'animalSpecies',
			"animalSizeCurrent",
			"animalSizePotential",
			"animalAdoptionFee",
			'animalCourtesy',
			'animalKillDate',
			"animalEagerToPlease", // mapped to "has video in cloudfront"
			"animalShedding"
		];
	} else if ($view == 'matchmaker') {
		$fields = [
			'animalName',
			'animalBreed',
			'animalGeneralAge',
			'animalPictures',
			'animalRescueID',
			'animalSummary',
			'animalSex',
			'animalGeneralSizePotential',
			'animalColorDetails',
			'animalVideoUrls',
			'animalID',
			'animalOthernames',
			'animalDistinguishingMarks',
			'animalSpecialneedsDescription',
			'animalDescriptionPlain',
			'animalSizeCurrent',
			'animalSizePotential',
			'animalSpecies',
			'animalPlayful',
			'animalAdoptionFee', // intake date
			'animalStatus',
			'animalAltered',

			// new categories
			'animalEnergyLevel',
			'animalOKWithKids',
			'animalOlderKidsOnly',
			'animalOKWithCats',
			'animalOKWithDogs',
			'animalNoSmallDogs',
			'animalOwnerExperience',
			'animalCourtesy',
			'animalKillDate',
			'animalShedding',
			'animalDeclawed' // mapped to "can live with other dogs" 
		];
	}

	if (isset($fields_override)) {
		$fields = $fields_override;
	}

	if ($view == 'search') {
		// if this a public search, use the public api because it
		// returns smaller payloads (contains the thumbnail url instead of the entire photos array) 
		$jsonBody = [
			'apikey' => $apikey,
			'objectType' => 'animals',
			'objectAction' => 'publicSearch',
			'search' => [
				'resultStart' => 0,
				'resultLimit' => $limit,
				'resultSort' => 'animalID',
				'resultOrder' => 'asc',
				'filters' => $filters,
				'fields' => $fields
			]
		];
	} else {
		$jsonBody = [
			'token' => $token,
			'tokenHash' => $tokenHash,
			'objectType' => 'animals',
			'objectAction' => 'search',
			'search' => [
				'resultStart' => 0,
				'resultLimit' => $limit,
				'resultSort' => $sort_key,
				'resultOrder' => $sort_dir,
				'filters' => $filters,
				'fields' => $fields
			]
		];
	}


	$endpoint = '/http/v2.json';
	
	try {
		$response = $client->request('POST', $endpoint, [
			'json' => $jsonBody
		]);
		$out = handle_rescuegroups_response($response, $logger, 'search_animals', $endpoint, $jsonBody);
		return $out;
	} catch (Exception $e) {
		return handle_rescuegroups_exception($e, $endpoint, $jsonBody, 'search_animals', null);
	}
}

function handle_rescuegroups_response($res, $logger, $context = '', $endpoint = null, $jsonBody = null) {
	$statuscode = $res->getStatusCode();
	$cache_enabled = is_rescuegroups_cache_enabled();
	$cache = $cache_enabled ? get_rescuegroups_cache() : null;
	
	// $logger->info("status is {$statuscode}");
	if ($statuscode >= 200 && $statuscode < 300) {
		$jsonString = $res->getBody();
		$animal = json_decode($jsonString, true);		

		// $logger->info("returning animal " . var_export($animal, true));
		// Check if response status is ok
		if ($animal['status'] != 'ok') {
			$logger->info('Error: API invalid status. context: ' . $context . ', status: ' . ($animal['status'] ?? 'unknown'));
			
			// Try to serve from cache when status is not ok (if cache is enabled)
			if ($cache_enabled && $endpoint !== null && $jsonBody !== null) {
				$cached_data = $cache->readCache($endpoint, $jsonBody);
				if ($cached_data !== null) {
					$logger->warning("API returned non-ok status, serving from cache. context: {$context}");
					return $cached_data;
				}
			}
			
			return null;
		}

		// Success! Cache the response before returning (if cache is enabled)
		$response_data = array_values($animal['data']);
		if ($cache_enabled && $endpoint !== null && $jsonBody !== null) {
			$cache->writeCache($endpoint, $jsonBody, $response_data);
		}
		
		return $response_data;
	} else {
		$logger->info("Error: API returned {$statuscode}");
		
		// Try to serve from cache when HTTP error occurs (if cache is enabled)
		if ($cache_enabled && $endpoint !== null && $jsonBody !== null) {
			$cached_data = $cache->readCache($endpoint, $jsonBody);
			if ($cached_data !== null) {
				$logger->warning("API returned {$statuscode}, serving from cache. context: {$context}");
				return $cached_data;
			}
		}
	}
	return null;
}

function parse_location_from_summary($summary) {
	$location = null;
	if (isset($summary)) {
		if (strpos($summary, 'foster') !== false) {
			$location = 'In Foster';
		} else {
			$location = str_replace('I am at Oakland Animal Services in kennel ', '', $summary);
		}
	}
	return $location;
}

// ================= routes ==================

function get_animal_by_id($animal_id, $view = 'full') {
	
	if (!isset($animal_id)) {
		return null;
	}
	
	$log = get_logger();

	// Default statuses
	$statuses = ['1', '2', '3'];
	
	// Add status '9' if not running on oaklandanimalservices.org
	$hostname = $_SERVER['HTTP_HOST'] ?? '';
	if ($hostname !== 'oaklandanimalservices.org' && $hostname !== 'www.oaklandanimalservices.org') {
		$statuses[] = '9'; // add transferred for nonproduction sites
	}
	
	$filters = [
		[
			'fieldName' => 'animalID',
			'operation' => 'equals',
			'criteria' => $animal_id
		]
		,
		[
			'fieldName' => 'animalStatusID',
			'operation' => 'equals',
			'criteria' => $statuses
		]
	];
	
	// $log->info('filters = ' . var_export($filters, true));
	return search_animals($filters, 1, $view);
}

function get_animal_by_acr($acr, $view = 'full') {
	if (!isset($acr)) {
		return null;
	}

	$filters = [
		[
			'fieldName' => 'animalStatus',
			'operation' => 'equals',
			'criteria' => 'Available'
		],
		[
			'fieldName' => 'animalRescueID',
			'operation' => 'equals',
			'criteria' => $acr
		]
	];
	if ($view == 'full') {
		array_push($filters, 		[
			'fieldName' => 'animalOrgID',
			'operation' => 'equals',
			'criteria' => '5970'
		]);
	}

	return search_animals($filters, 1, $view);
}

function get_animal_by_name($name, $view = 'full') {
	if (!isset($name)) {
		return null;
	}

	$filters = [
		[
			'fieldName' => 'animalStatus',
			'operation' => 'equals',
			'criteria' => 'Available'
		],
		[
			'fieldName' => 'animalName',
			'operation' => 'contains',
			'criteria' => $name
		]
	];
	if ($view == 'full') {
		array_push($filters, 		[
			'fieldName' => 'animalOrgID',
			'operation' => 'equals',
			'criteria' => '5970'
		]);
	}

	return search_animals($filters, 1, $view);
}

function set_has_video($animal_id, $has_video) {
	$logger = get_logger();
	$client = get_rescuegroups_client();
	$token = getenv('RG_TOKEN');
	$tokenHash = getenv('RG_TOKEN_HASH');
	$jsonBody = [
		'token' => $token,
		'tokenHash' => $tokenHash,
		'objectType' => 'animals',
		'objectAction' => 'edit',
		'values' => [
			[
				'animalID' => $animal_id,
				'animalEagerToPlease' => ($has_video == true ? "Yes" : "")
			]
		]
	];

	$endpoint = '/http/v2.json';
	
	try {
		$response = $client->request('POST', $endpoint, [
			'json' => $jsonBody
		]);
		// Note: This is a write operation, we don't cache writes
		handle_rescuegroups_response($response, $logger, 'set_has_video', null, null);
	} catch (Exception $e) {
		$logger->error("Error in set_has_video: {$e->getMessage()}");
		return null;
	}
}

// https://futuremediagr.medium.com/easy-versioning-for-css-and-js-files-in-wordpress-e7dad756586c
function set_custom_ver_css_js( $src ) {
	// style.css URI
	$style_file = get_stylesheet_directory().'/style.css'; 

	if ( $style_file ) {
		// css file timestamp
		$version = filemtime($style_file); 
		
		if ( strpos( $src, 'ver=' ) )
			// use the WP function add_query_arg() 
			// to set the ver parameter in 
			$src = add_query_arg( 'ver', $version, $src );
		return esc_url( $src );

	}
}

function render_large_dog_capacity_text() {
	$counts_client = new GuzzleHttp\Client([
		'base_uri' => 'https://dtvp6vjonk7z3.cloudfront.net',
		'timeout'  => 2.0
	]);

	try {
		$response = $counts_client->request('GET', '/animal-stats/dogs.json');
		$jsonString = $response->getBody();
		$stats = json_decode($jsonString, true);	
		$capacity_status = 'under capacity';
			// /animal-stats/dogs.json

		$large_dog_count = $stats['inShelterLarge'];

		if ($large_dog_count < 63) {
			// echo '<div class="dog-meter"><img src="' . get_stylesheet_directory_uri() . '/images/meter01.png"/></div>';
		} else if ($large_dog_count < 74) {
			// echo '<div class="dog-meter"><img src="' . get_stylesheet_directory_uri() . '/images/meter02.png"/></div>';
			$capacity_status = 'AT CAPACITY';
		} else if ($large_dog_count <= 90) {
			// echo '<div class="dog-meter"><img src="' . get_stylesheet_directory_uri() . '/images/meter03.png"/></div>';
			$capacity_status = 'OVER CAPACITY';
		} else if ($large_dog_count > 90) {
			// echo '<div class="dog-meter"><img src="' . get_stylesheet_directory_uri() . '/images/meter04.png"/></div>';
			$capacity_status = 'OVER CAPACITY';
		}
		
		$date = new DateTime();
    	$date->setTimezone(new DateTimeZone('America/Los_Angeles'));
    	$date_string = $date->format('l, F jS');
		$status_color = '#000000';

		echo '<p><strong>Today, ' . $date_string . ', we have <span style="color: ' . $status_color . '">' . $large_dog_count . '</span> big dogs in the shelter. Our shelter capacity is 73 kennels, and we should always have several kennels open for incoming dogs, so we are currently <span style="color: ' . $status_color . '">' . $capacity_status . '</span>.</strong></p>';

	} catch (Exception $e) {
		// $logger->info(var_export($e,true));
		$logger->info("Error: {$e->getMessage()}");
	}
}

function fetch_foster_dog_event_data() {
    $logger = get_logger();
	if (!empty($GLOBALS['foster_dogs_attending_events'])) {
		// $log->info('returning early' . var_export($GLOBALS['foster_dogs_attending_events'],true));
		return $GLOBALS['foster_dogs_attending_events'];
	}


	$counts_client = new GuzzleHttp\Client([
		'base_uri' => 'https://dtvp6vjonk7z3.cloudfront.net',
		'timeout'  => 2.0
	]);

	try {
		$response = $counts_client->request('GET', '/adoption-event-info/oas-adoption-days.json');
		$jsonString = $response->getBody();

		// $logger->info($jsonString);		

		$json_object = json_decode($jsonString, true);

		$GLOBALS['foster_dogs_attending_events'] = $json_object;
		// $logger->info('returning ' . var_export($GLOBALS['foster_dogs_attending_events'],true));
		return $json_object;

	} catch (Exception $e) {
		// $logger->info('fetch exception caught');
		// $logger->info(var_export($e,true));
		$logger->info("Error loading foster dogs at events: {$e->getMessage()}");
		return ["events" => [], "attendeesByRescueGroupsID" => []];
	}
}

function fetch_static_training_data() {
	$logger = get_logger();
	
	// Create a client for CloudFront
	$client = new GuzzleHttp\Client([
		'base_uri' => 'https://dtvp6vjonk7z3.cloudfront.net',
		'timeout'  => 5.0
	]);
	
	try {
		$response = $client->request('GET', '/matchmaking-static/2025/03/01/19.json');
		$out = handle_rescuegroups_response($response, $logger, 'fetch_static_training_data');
		return $out;
	} catch (Exception $e) {
		// $logger->info(var_export($e, true));
		$logger->info("Error fetching static training data: {$e->getMessage()}");
		return null;
	}
}

function get_cats_in_location($location_string) {
	if (!isset($location_string) || strlen($location_string) == 0) {
		return [];
	}
	
	$logger = get_logger();
	$client = get_rescuegroups_client();
	$token = getenv('RG_TOKEN');
	$tokenHash = getenv('RG_TOKEN_HASH');
	
	$filters = [
		[
			'fieldName' => 'animalSummary',
			'operation' => 'contains',
			'criteria' => $location_string
		],
		[
			'fieldName' => 'animalStatus',
			'operation' => 'equals',
			'criteria' => 'Available'
		],
		[
			'fieldName' => 'animalSpecies',
			'operation' => 'equals',
			'criteria' => 'Cat'
		]
	];
	
	$fields = ['animalID', 'animalName', 'animalSizePotential', 'animalSummary'];
	
	$jsonBody = [
		'token' => $token,
		'tokenHash' => $tokenHash,
		'objectType' => 'animals',
		'objectAction' => 'search',
		'search' => [
			'resultStart' => 0,
			'resultLimit' => 200,
			'resultSort' => 'animalID',
			'resultOrder' => 'asc',
			'filters' => $filters,
			'fields' => $fields
		]
	];

	$endpoint = '/http/v2.json';
	
	try {
		$response = $client->request('POST', $endpoint, [
			'json' => $jsonBody
		]);
		$result = handle_rescuegroups_response($response, $logger, 'get_cats_in_location', $endpoint, $jsonBody);
		return $result ?: [];
	} catch (Exception $e) {
		return handle_rescuegroups_exception($e, $endpoint, $jsonBody, 'get_cats_in_location', []);
	}
}

function can_cat_be_adopted_alone($animal) {
	if (!isset($animal) || !is_array($animal) || empty($animal)) {
		return false;
	}
	
	$summary = $animal['animalSummary'] ?? '';
	$age_numeric = floatval($animal['animalSizePotential'] ?? 0);
	$cat_name = $animal['animalName'] ?? '';
	
	// If cat has "bonded" in name, cannot be adopted alone regardless of other factors
	if (stripos($cat_name, 'bonded') !== false) {
		return false;
	}
	
	// If cat is in foster, always eligible to be adopted alone
	if (stripos($summary, 'foster') !== false) {
		return true;
	}
	
	// Extract location from summary for cats not in foster
	$location = parse_location_from_summary($summary);
	if (!$location || $location == 'In Foster' || $location == 'N/A') {
		return false;
	}
	
	// Get other cats in the same location
	$cats_in_location = get_cats_in_location($location);
	$cat_count = count($cats_in_location);
	
	// If cat is alone in location, can be adopted alone
	if ($cat_count <= 1) {
		return true;
	}
	
	// If cat is under 6 months (0.5 years) AND odd number of cats in location
	if ($age_numeric < 0.5 && ($cat_count % 2 == 1)) {
		return true;
	}
	
	// If exactly two cats over 6 months old, they can be adopted alone unless "bonded" in name
	if ($cat_count == 2) {
		$all_cats_adult = true;
		$has_bonded_name = false;
		
		foreach ($cats_in_location as $location_cat) {
			$cat_age = floatval($location_cat['animalSizePotential'] ?? 0);
			$cat_name = $location_cat['animalName'] ?? '';
			
			// Check if cat is under 6 months
			if ($cat_age < 0.5) {
				$all_cats_adult = false;
				break;
			}
			
			// Check if "bonded" appears in the name (case insensitive)
			if (stripos($cat_name, 'bonded') !== false) {
				$has_bonded_name = true;
				break;
			}
		}
		
		// If both cats are adults and neither has "bonded" in name, they can be adopted alone
		if ($all_cats_adult && !$has_bonded_name) {
			return true;
		}
	}
	
	// Otherwise, cannot be adopted alone
	return false;
}

function calculate_bulk_cat_adoption_eligibility($animals) {
	$eligibility = [];
	$location_counts = [];
	$location_cats = [];
	
	// Group cats by location and calculate counts
	foreach ($animals as $animal) {
		$animal_id = $animal['animalID'];
		$summary = $animal['animalSummary'] ?? '';
		$age_numeric = floatval($animal['animalSizePotential'] ?? 0);
		$cat_name = $animal['animalName'] ?? '';
		
		// If cat has "bonded" in name, cannot be adopted alone regardless of other factors
		if (stripos($cat_name, 'bonded') !== false) {
			$eligibility[$animal_id] = false;
			continue;
		}
		
		// If cat is in foster, always eligible to be adopted alone
		if (stripos($summary, 'foster') !== false) {
			$eligibility[$animal_id] = true;
			continue;
		}
		
		// Extract location from summary for cats not in foster
		$location = parse_location_from_summary($summary);
		if (!$location || $location == 'In Foster' || $location == 'N/A') {
			$eligibility[$animal_id] = false;
			continue;
		}
		
		// Group by location
		if (!isset($location_counts[$location])) {
			$location_counts[$location] = 0;
			$location_cats[$location] = [];
		}
		$location_counts[$location]++;
		$location_cats[$location][] = [
			'id' => $animal_id,
			'age' => $age_numeric,
			'name' => $animal['animalName'] ?? ''
		];
	}
	
	// Now calculate eligibility for each cat based on location data
	foreach ($location_cats as $location => $cats) {
		$cat_count = $location_counts[$location];
		
		// Check if this location qualifies for the "two adult cats" rule
		$two_adult_cats_eligible = false;
		if ($cat_count == 2) {
			$all_cats_adult = true;
			$has_bonded_name = false;
			
			foreach ($cats as $cat_info) {
				if ($cat_info['age'] < 0.5) {
					$all_cats_adult = false;
					break;
				}
				if (stripos($cat_info['name'], 'bonded') !== false) {
					$has_bonded_name = true;
					break;
				}
			}
			
			$two_adult_cats_eligible = $all_cats_adult && !$has_bonded_name;
		}
		
		foreach ($cats as $cat_info) {
			$animal_id = $cat_info['id'];
			$age_numeric = $cat_info['age'];
			$cat_name = $cat_info['name'];
			
			// If cat has "bonded" in name, cannot be adopted alone regardless of other factors
			if (stripos($cat_name, 'bonded') !== false) {
				$eligibility[$animal_id] = false;
			}
			// If cat is alone in location, can be adopted alone
			else if ($cat_count <= 1) {
				$eligibility[$animal_id] = true;
			}
			// If cat is under 6 months (0.5 years) AND odd number of cats in location
			else if ($age_numeric < 0.5 && ($cat_count % 2 == 1)) {
				$eligibility[$animal_id] = true;
			}
			// If exactly two adult cats without "bonded" in name, can be adopted alone
			else if ($two_adult_cats_eligible) {
				$eligibility[$animal_id] = true;
			}
			// Otherwise, cannot be adopted alone
			else {
				$eligibility[$animal_id] = false;
			}
		}
	}
	
	return $eligibility;
}