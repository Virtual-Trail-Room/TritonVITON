// app/info/page.js
import Head from "next/head";
import Link from "next/link";

export const metadata = {
  title: "TritonVITON Info",
  description: "Project overview and background for TritonVITON",
};

export default function InfoPage() {
  return (
    <>
      <Head>
        <title>TritonVITON • Info</title>
        <meta
          name="description"
          content="Project overview and background for TritonVITON"
        />
      </Head>
      <div className="max-w-4xl mx-auto py-12 px-6 space-y-12 text-gray-800 dark:text-gray-200">
        {/* Back link */}
        <Link
          href="/"
          className="inline-block mb-4 text-blue-600 hover:underline dark:text-blue-400"
        >
          ← Back to Home
        </Link>

        {/* Title & Authors */}
        <header className="space-y-4">
          <h1 className="text-4xl font-extrabold">
            TritonVITON  
            <span className="block text-lg font-light mt-1">
              3D‑aware Real‑time Video Virtual Trial On 
            </span>
          </h1>
          <p className="text-sm">
            Eric Zhao¹*, Huaijing Hong¹*, Jesus Gonzales¹*, Thanh‑Long Nguyen Trong¹*, Bhavik
            Chandna¹†  
            <br />
            ¹ University of California, San Diego • * Equal contribution • † Team lead
          </p>
        </header>

        {/* GUI Layout */}
        <section className="space-y-2">
          <h2 className="text-2xl font-bold">GUI Layout</h2>
          <p>
            The left panel lets you choose garment categories; the right panel shows
            thumbnails of that category.  Pinch‑to‑select with your hand, and “Add Item” uploads
            your own piece for real‑time try‑on.
          </p>
        </section>

        {/* Method Overview */}
        <section className="space-y-2">
          <h2 className="text-2xl font-bold">Method Overview</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Hand Tracking</strong>: Mediapipe detects pinch gestures to navigate the UI.
            </li>
            <li>
              <strong>Pose & Segmentation</strong>: YOLOv11 keypoints + human parsing guide cloth warping.
            </li>
            <li>
              <strong>Cloth Warping</strong>: Deform 2D garments via TPS and a UNet-based refinement
              network.
            </li>
            <li>
              <strong>3D Garments</strong>: (Future) detailed meshes for physics‑aware draping.
            </li>
            <li>
              <strong>Classifier</strong>: ResNet‑50 based model auto‑categorizes uploads into 11
              garment types.
            </li>
          </ul>
        </section>

        {/* Motivation & Background */}
        <section className="space-y-2">
          <h2 className="text-2xl font-bold">Motivation & Background</h2>
          <p>
            Digital fashion is booming—by 2030 the virtual try‑on market is projected at
            $15 billion. Yet most solutions are pay‑walled or hardware‑intensive. Today
            71% of consumers expect personalized interactions, but existing systems (e.g.
            Amazon’s Echo Look) still cover only a few item types.
          </p>
          <p>
            <strong>TritonVITON</strong> brings real‑time, webcam‑only virtual fitting to any
            user, achieving sub‑2s latency and covering 11 garment categories with true
            texture and motion consistency.
          </p>
        </section>

        System Details
        <section className="space-y-2">
          <h2 className="text-2xl font-bold">System Details</h2>
          <dl className="space-y-4">
            <div>
              <dt className="font-semibold">Cloth Warping Pipeline</dt>
              <dd className="ml-4">
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    <strong>Pre‑processing:</strong> Generate cloth‑agnostic representation
                    (pose map, body mask, face/hair segmentation).
                  </li>
                  <li>
                    <strong>Deformation:</strong> Extract features, compute TPS parameters θ via
                    regression network to warp garment.
                  </li>
                  <li>
                    <strong>Refinement:</strong> UNet‑based network produces final rendered image
                    and mask.
                  </li>
                </ol>
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Classifier</dt>
              <dd className="ml-4">
                <p>ResNet‑50 backbone, fine‑tuned on DeepFashion‑C (240k images).</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Train/Val/Test split: 60% / 20% / 20%</li>
                  <li>Test accuracy: 81.37%</li>
                  <li>Techniques: weighted CE, targeted augmentation</li>
                </ul>
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Performance</dt>
              <dd className="ml-4">
                <p>
                  Real‑time, lightweight for edge GPUs (e.g. Jetson Nano,
                  RTX‑series laptops), and no external hardware beyond a standard webcam.
                </p>
              </dd>
            </div>
          </dl>
        </section>

        {/* Results & Future Work */}
        <section className="space-y-2">
          <h2 className="text-2xl font-bold">Results & Future Work</h2>
          <p>
            We demonstrate superior garment alignment versus prior art on multiple datasets
            (see chart below). Future directions include user accounts, multi‑item trials,
            and full 3D physics‑driven draping.
          </p>
          {/* Placeholder for a chart image */}
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
            <span className="text-gray-500 dark:text-gray-400">[Performance Chart]</span>
          </div>
        </section>

        {/* References */}
        <section className="space-y-2">
          <h2 className="text-2xl font-bold">References</h2>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li>
              Han, X. et al. “VITON: An image‑based virtual try‑on network.” CVPR ’18.
            </li>
            <li>
              Wu, Y. et al. “Virtual fitting system based on gesture recognition.” Sci. Reports
              12.1 (2022): 18356.
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
