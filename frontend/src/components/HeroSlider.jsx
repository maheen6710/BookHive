import { useState, useEffect } from "react";
import "./HeroSlider.css";
import slide1Img from '../assets/slide1.png';   
import slide2Img from '../assets/slide2.png';
import slide3Img from '../assets/slide3.png';

const slides = [
  { image: slide1Img },
  { image: slide2Img },
  { image: slide3Img },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  // Auto-advance every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 3000);

    // Cleanup: clears interval when component unmounts
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="slider-container">
      {/* Slides wrapper — shifts left/right via transform */}
      <div
        className="slider-track"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className="slide"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
        ))}
      </div>

      {/* Dot navigation */}
      <div className="slider-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`dot ${i === current ? "active" : ""}`}
            onClick={() => setCurrent(i)}
          />
        ))}
      </div>
    </div>
  );
}
