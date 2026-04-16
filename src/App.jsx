import { useState } from "react";
import { ThemeProvider } from "./hooks/useTheme";
import Sidebar from "./components/layout/Sidebar";
import Login from "./pages/Login";
import BasicVerification from "./pages/BasicVerification";
import APIVerification from "./pages/APIVerification";
import FraudAnalytics from "./pages/FraudAnalytics";
import FraudTestLab from "./pages/FraudtestLab";
import PastRecords from "./pages/PastRecords";

function Shell() {
  const [user,       setUser]       = useState(null);
  const [page,       setPage]       = useState("basic");
  const [session,    setSession]    = useState(null);
  const [allResults, setAllResults] = useState(null);

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div style={{ display:"flex", height:"100vh", background:"var(--bg-base)", overflow:"hidden" }}>
      <Sidebar activePage={page} setActivePage={setPage} session={session} user={user}
        onLogout={()=>{ setUser(null); setSession(null); setAllResults(null); setPage("basic"); }} />
      <main style={{ flex:1, overflowY:"auto" }}>
        {page==="basic"     && <BasicVerification  session={session} setSession={setSession} setAllResults={setAllResults} allResults={allResults} setActivePage={setPage} />}
        {page==="verify"    && <APIVerification    session={session} allResults={allResults} />}
        {page==="fraud"     && <FraudAnalytics     session={session} />}
        {page==="fraudlab"  && <FraudTestLab />}
        {page==="records"   && <PastRecords />}
      </main>
    </div>
  );
}

export default function App() {
  return <ThemeProvider><Shell /></ThemeProvider>;
}