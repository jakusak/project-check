import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { Home } from "./pages/Home";
import { Journey } from "./pages/Journey";
import { Learn } from "./pages/Learn";
import { ProjectDetail } from "./pages/ProjectDetail";

const App = () => (
  <BrowserRouter>
    <div className="min-h-screen bg-background">
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/journey" element={<Journey />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
      </Routes>
    </div>
  </BrowserRouter>
);

export default App;
