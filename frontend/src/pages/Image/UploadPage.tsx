import React from "react"
import {useState, type ChangeEvent} from "react"

const ImageUpload = () => {
    const [image, setImage] = useState<string | null>(null);

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImage(null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-md shadow-md w-full max-w-md mx-auto">
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="border p-2 rounded-md"
      />
      {image && (
        <img
          src={image}
          alt="Preview"
          className="w-full max-w-xs rounded-md border"
        />
      )}
    </div>
  );
}
  
export default ImageUpload;