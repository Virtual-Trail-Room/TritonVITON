import "../src/app/globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import HeaderBar from "../components/HeaderBar";
// ↓ Remove this import
// import { HandednessProvider } from "../contexts/HandednessContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "TritonVITON",
  description: "A gesture-controlled clothing selector & 3D model viewer",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <HeaderBar />
        <main>{children}</main>
      </body>
    </html>
  );
}
