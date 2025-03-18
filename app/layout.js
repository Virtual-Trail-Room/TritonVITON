import "../src/app/globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import DarkModeToggle from "../components/DarkModeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Gesture-Based Clothing Selector",
  description: "A gesture-controlled clothing selector using MediaPipe Hands",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="p-4 flex justify-end">
          <DarkModeToggle />
        </div>
        {children}
      </body>
    </html>
  );
}
