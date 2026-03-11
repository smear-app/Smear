import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Logging from './pages/logging'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/log" element={<Logging />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App