// app/info/page.js
export default function InfoPage() {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">About TritonVITON</h1>
        <p className="mb-2">
          TritonVITON is a gesture-controlled clothing selector & 3D model viewer. 
          It uses advanced techniques such as MediaPipe Hands for gesture recognition 
          and InstantMesh for generating 3D assets from 2D images.
        </p>
        <p>
          This project aims to combine cutting-edge machine learning and computer 
          vision with an intuitive user interface, offering an innovative way to 
          interact with digital clothing and 3D assets.
        </p>
        <p>
          Project Members: Bhavik Chandna, Jesus Gonzalez, Huaijing Hong, Thanh-Long Nguyen Trong, Eric Zhao
        </p>
        {/* Add further details about the project here */}
      </div>
    );
  }
  