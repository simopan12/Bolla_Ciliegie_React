import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import BolleList from "./components/BolleList";
import BollaForm from "./components/BollaForm";
import Report from "./components/Report";
import Dipendenti from "./components/Dipendenti";
import Costi from "./components/Costi";
import Dashboard from "./components/Dashboard";
import Clienti from "./components/Clienti";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
          <Routes>
            <Route path="/"              element={<BolleList />} />
            <Route path="/nuova"         element={<BollaForm />} />
            <Route path="/modifica/:id"  element={<BollaForm />} />
            <Route path="/report"        element={<Report />} />
            <Route path="/dipendenti"    element={<Dipendenti />} />
            <Route path="/costi"         element={<Costi />} />
            <Route path="/dashboard"     element={<Dashboard />} />
            <Route path="/clienti"       element={<Clienti />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
