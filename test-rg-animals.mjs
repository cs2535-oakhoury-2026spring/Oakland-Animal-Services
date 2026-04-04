/**
 * Test script to fetch real animals from RescueGroups API
 * Run with: node test-rg-animals.mjs
 */
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const RG_ENDPOINT = process.env.RESCUE_GROUPS_ENDPOINT;
const RG_BEARER = process.env.RESCUE_GROUPS_BEARER;

if (!RG_ENDPOINT || !RG_BEARER) {
  console.error('ERROR: Missing RescueGroups credentials in .env');
  console.error('RESCUE_GROUPS_ENDPOINT:', RG_ENDPOINT ? 'SET' : 'MISSING');
  console.error('RESCUE_GROUPS_BEARER:', RG_BEARER ? 'SET' : 'MISSING');
  process.exit(1);
}

const client = axios.create({
  baseURL: RG_ENDPOINT,
  headers: { Authorization: `Bearer ${RG_BEARER}` },
});

async function fetchAnimals() {
  console.log('\nQuerying RescueGroups API...\n');

  try {
    const payload = {
      objectType: 'animals',
      objectAction: 'search',
      search: {
        resultStart: 0,
        resultLimit: 20,
        resultSort: 'animalUpdatedDate',
        resultOrder: 'desc',
        filters: [
          {
            fieldName: 'animalStatusID',
            operation: 'equals',
            criteria: ['1', '16', '20'], // Available, At Shelter, Foster
          },
        ],
        fields: [
          'animalID',
          'animalName',
          'animalSpecies',
          'animalSummary',
          'animalRescueID',
          'animalThumbnailUrl',
        ],
      },
    };

    const response = await client.post('', payload);
    const animals = response.data?.data || {};

    if (Object.keys(animals).length === 0) {
      console.log('No animals found in RescueGroups.\n');
      return;
    }

    console.log(`Found ${Object.keys(animals).length} animals:\n`);
    console.log('─'.repeat(100));

    for (const [key, animal] of Object.entries(animals)) {
      const id = animal.animalID;
      const name = animal.animalName || 'Unknown';
      const species = animal.animalSpecies || 'Unknown';
      const arn = animal.animalRescueID || 'N/A';
      const summary = animal.animalSummary || '';

      // Parse location from summary
      let location = 'Unknown';
      const prefix = 'I am at Oakland Animal Services in kennel ';
      if (summary.startsWith(prefix)) {
        location = summary.slice(prefix.length).split('.')[0].trim();
      } else if (summary.toLowerCase().includes('foster')) {
        location = 'In Foster';
      }

      console.log(`${name} (${species})`);
      console.log(`   Animal ID: ${id}`);
      console.log(`   ARN: ${arn}`);
      console.log(`   Location: ${location}`);
      console.log(`   Direct URL: http://localhost:3001/?petId=${id}`);
      
      // Generate QR URL if location is parseable
      if (location !== 'Unknown' && location !== 'In Foster' && !location.includes('I am')) {
        // Strip species prefix from location (e.g., "Dog I:5" -> "I:5")
        let kennelLocation = location.replace(/^(Cat|Dog)\s+/i, '').trim();
        // Convert to URL format (spaces to hyphens, lowercase)
        const urlLocation = kennelLocation.toLowerCase().replace(/\s+/g, '-');
        const petType = species.toLowerCase();
        console.log(`   QR URL: http://localhost:3001/?type=${petType}&location=${urlLocation}`);
      }
      console.log('─'.repeat(100));
    }

    console.log('\nTIP: Copy any of the URLs above to test with real RescueGroups data.\n');

  } catch (error) {
    console.error('Error fetching animals:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('\nAuthentication failed. Check your RESCUE_GROUPS_BEARER token.\n');
    }
  }
}

fetchAnimals();
