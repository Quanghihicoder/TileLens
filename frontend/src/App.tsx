import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home/HomePage';
import ImageView from './pages/Image/ViewPage';
import ImageUpload from './pages/Image/UploadPage';

const App = () => {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="/image">
        <Route index element={<ImageView />} />
        <Route path="upload" element={<ImageUpload />} />
      </Route>
      {/* <Route path="*" element={<ImageUpload />} /> */}
    </Routes>
  );
}

export default App;
