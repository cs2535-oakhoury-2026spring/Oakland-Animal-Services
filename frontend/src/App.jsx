// Oakland Animal Services Portal - Frontend
import { useState, useEffect, useCallback } from "react";
import { api, applyToken as apiApplyToken, clearToken, setOnAccountExpired } from "./api.js";
import { decodeJwt } from "./utils.js";

// Screens
import LoginScreen from "./screens/LoginScreen.jsx";
import ForcePasswordChangeScreen from "./screens/ForcePasswordChangeScreen.jsx";
import ChangePasswordModal from "./screens/ChangePasswordModal.jsx";
import ExpiredAccountScreen from "./screens/ExpiredAccountScreen.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import LocationsPage from "./screens/LocationsPage.jsx";
import ActivityLogScreen from "./screens/ActivityLogScreen.jsx";
import UserManagementScreen from "./screens/UserManagement/UserManagementScreen.jsx";

// Components
import Portal from "./components/Portal.jsx";
import AnimalSelection from "./components/AnimalSelection.jsx";
import ErrorScreen from "./components/ErrorScreen.jsx";

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [accessToken, setAccessToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [accountExpired, setAccountExpired] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [animals, setAnimals] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const isDark = localStorage.getItem("darkMode") === "true";
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    return isDark;
  });

  const toggleDarkMode = (val) => {
    localStorage.setItem("darkMode", val);
    document.documentElement.setAttribute("data-theme", val ? "dark" : "light");
    setDarkMode(val);
  };

  const [locationError, setLocationError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const applyToken = (token) => {
    const payload = decodeJwt(token);
    apiApplyToken(token);
    sessionStorage.setItem("oas_token", token);
    setAccessToken(token);
    setCurrentUser({
      userId: payload?.userId,
      username: payload?.username,
      displayName: payload?.username || "User",
      role: payload?.role || "staff",
      expiresAt: payload?.expiresAt,
      email: "",
      department: "",
    });
    setMustChangePassword(!!payload?.mustChangePassword);
  };

  const handleLogin = (token) => applyToken(token);

  useEffect(() => {
    const stored = sessionStorage.getItem("oas_token");
    const payload = stored ? decodeJwt(stored) : null;
    const isExpired = payload ? payload.exp * 1000 < Date.now() : true;

    if (stored && !isExpired) {
      applyToken(stored);
      setSessionLoading(false);
      api.refreshToken().then(applyToken).catch(() => {
        clearToken();
        sessionStorage.removeItem("oas_token");
        setAccessToken(null);
        setCurrentUser(null);
      });
    } else {
      api.refreshToken()
        .then((token) => applyToken(token))
        .catch(() => {
          clearToken();
          sessionStorage.removeItem("oas_token");
          setAccessToken(null);
          setCurrentUser(null);
        })
        .finally(() => setSessionLoading(false));
    }
  }, []);

  const handleLogout = useCallback(async () => {
    if (accessToken) await api.logout(accessToken);
    clearToken();
    sessionStorage.removeItem("oas_token");
    setAccessToken(null);
    setCurrentUser(null);
    setMustChangePassword(false);
    setSelectedPetId(null);
    setAnimals([]);
    setLocationError(null);
    window.history.replaceState({}, "", "/");
  }, [accessToken]);

  useEffect(() => {
    // Any auth-expired callback from api.js should force a clean logout to login screen.
    setOnAccountExpired(() => {
      handleLogout();
    });

    return () => setOnAccountExpired(null);
  }, [handleLogout]);

  const handlePasswordChanged = () => setMustChangePassword(false);

  const urlParams = new URLSearchParams(window.location.search);
  const urlPetId = urlParams.get("petId");
  const petType = urlParams.get("type");
  const kennelLocation = urlParams.get("location");
  const view = urlParams.get("view");
  const homePageParam = Number(urlParams.get("page") || "1");
  const homePage = Number.isFinite(homePageParam) && homePageParam > 0 ? Math.floor(homePageParam) : 1;
  const hasUrlParams = !!(urlPetId || (petType && kennelLocation));

  useEffect(() => {
    if (!accessToken || !hasUrlParams) return;
    if (urlPetId) { setSelectedPetId(urlPetId); return; }
    setLocationError(null);
    api.getPetsByLocation(petType, kennelLocation)
      .then((pets) => { setAnimals(pets); if (pets.length === 1) setSelectedPetId(pets[0].petId); })
      .catch((err) => { setLocationError(err.message); });
  }, [accessToken, urlPetId, petType, kennelLocation]);

  const handleRefresh = () => {
    if (!petType || !kennelLocation || refreshing) return;
    setRefreshing(true);
    api.getPetsByLocation(petType, kennelLocation, true)
      .then((pets) => { setAnimals(pets); })
      .catch((err) => { setLocationError(err.message); })
      .finally(() => { setRefreshing(false); });
  };

  if (sessionLoading) {
    return (
      <div className="app-loading">
        <div className="oas-spinner" />
      </div>
    );
  }

  if (accountExpired) {
    return <ExpiredAccountScreen user={currentUser} onLogout={handleLogout} darkMode={darkMode} setDarkMode={toggleDarkMode} />;
  }

  if (!accessToken) {
    return <LoginScreen darkMode={darkMode} setDarkMode={toggleDarkMode} onLogin={handleLogin} />;
  }

  if (mustChangePassword && currentUser?.role !== "device") {
    return <ForcePasswordChangeScreen user={currentUser} token={accessToken} onPasswordChanged={handlePasswordChanged} onLogout={handleLogout} darkMode={darkMode} setDarkMode={toggleDarkMode} />;
  }

  if (view === "activity") {
    return (
      <>
        <ActivityLogScreen user={currentUser} token={accessToken} onLogout={handleLogout} darkMode={darkMode} setDarkMode={toggleDarkMode} />
        {showChangePassword && <ChangePasswordModal token={accessToken} onClose={() => setShowChangePassword(false)} />}
      </>
    );
  }

  if (view === "users" && (currentUser?.role === "admin" || currentUser?.role === "staff")) {
    return (
      <>
        <UserManagementScreen user={currentUser} token={accessToken} onLogout={handleLogout} darkMode={darkMode} setDarkMode={toggleDarkMode} />
        {showChangePassword && <ChangePasswordModal token={accessToken} onClose={() => setShowChangePassword(false)} />}
      </>
    );
  }

  if (view === "locations") {
    return (
      <>
        <LocationsPage user={currentUser} token={accessToken} onLogout={handleLogout} darkMode={darkMode} setDarkMode={toggleDarkMode} onChangePassword={() => setShowChangePassword(true)} />
        {showChangePassword && <ChangePasswordModal token={accessToken} onClose={() => setShowChangePassword(false)} />}
      </>
    );
  }

  if (!hasUrlParams && !selectedPetId) {
    return (
      <>
        <HomeScreen user={currentUser} token={accessToken} onLogout={handleLogout} darkMode={darkMode} setDarkMode={toggleDarkMode} onChangePassword={() => setShowChangePassword(true)} />
        {showChangePassword && <ChangePasswordModal token={accessToken} onClose={() => setShowChangePassword(false)} />}
      </>
    );
  }

  if (locationError) {
    return <ErrorScreen error={locationError} onLogout={handleLogout} />;
  }

  if (!selectedPetId && animals.length > 1) {
    return <AnimalSelection animals={animals} onSelect={setSelectedPetId} user={currentUser} token={accessToken} onLogout={handleLogout} onBack={() => { window.location.href = "/"; }} darkMode={darkMode} setDarkMode={toggleDarkMode} onRefresh={handleRefresh} refreshing={refreshing} onChangePassword={() => setShowChangePassword(true)} />;
  }

  if (selectedPetId) {
    return <Portal user={currentUser} token={accessToken} petId={selectedPetId} onLogout={handleLogout} onBack={animals.length > 1 ? () => setSelectedPetId(null) : () => { window.location.href = homePage > 1 ? `/?page=${homePage}` : "/"; }} darkMode={darkMode} setDarkMode={toggleDarkMode} onChangePassword={() => setShowChangePassword(true)} />;
  }

  return (
    <div className="app-loading">
      <div className="oas-spinner" />
      <span style={{ color: "var(--clr-warm-gray)", fontSize: 15 }}>Loading animals...</span>
    </div>
  );
}
