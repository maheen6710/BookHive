import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import "./ImageSearchModal.css";

// STAGES: "choose" -> "camera" -> "loading" -> "results"
export default function ImageSearchModal({ onClose }) {
  const [stage, setStage] = useState("choose");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const navigate = useNavigate();

  const uploadInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Always stop the webcam when the modal unmounts, so the camera light
  // doesn't stay on after the user closes the popup
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const openCamera = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // prefers rear camera on devices that have one
      });
      streamRef.current = stream;
      setStage("camera");
      // videoRef isn't attached to the DOM yet on this same tick, so wait a beat
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 0);
    } catch (err) {
      console.error("Camera access error:", err);
      setErrorMsg(
        "Couldn't access your camera — check that you allowed permission, or upload a photo instead"
      );
      setStage("results");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      stopCamera();
      handleFileSelected(blob);
    }, "image/jpeg", 0.9);
  };

  const handleFileSelected = async (file) => {
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setStage("loading");
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("coverImage", file, file.name || "capture.jpg");

      const res = await fetch("http://localhost:5000/api/imagesearch", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || "Something went wrong");
        setStage("results");
        return;
      }

      if (data.extracted?.title || data.extracted?.author) {
        // Success — skip the extra screen, go straight to search results
        const query = [data.extracted.title, data.extracted.author].filter(Boolean).join(" ");
        navigate(`/search?q=${encodeURIComponent(query)}`);
        onClose();
        return;
      }

      // Nothing identified — show the "not found" state
      setErrorMsg(data.message || "Couldn't identify this book — try a clearer photo");
      setStage("results");
    } catch (err) {
      console.error(err);
      setErrorMsg("Couldn't reach the server, try again");
      setStage("results");
    }
  };

  const resetToChoose = () => {
    setStage("choose");
    setPreviewUrl(null);
    setErrorMsg(null);
  };

  return createPortal(
    <div className="imgsearch-overlay" onClick={onClose}>
      <div className="imgsearch-modal" onClick={(e) => e.stopPropagation()}>
        <button className="imgsearch-close" onClick={onClose} aria-label="Close">
          &times;
        </button>

        {stage === "choose" && (
          <>
            <h2 className="imgsearch-title">Search by Cover</h2>
            <p className="imgsearch-subtitle">
              Snap or upload a photo of a book cover and we'll find it for you
            </p>

            <div className="imgsearch-options">
              <button className="imgsearch-option-btn" onClick={openCamera}>
                📷 Take a Photo
              </button>
              <button
                className="imgsearch-option-btn"
                onClick={() => uploadInputRef.current.click()}
              >
                🖼️ Upload from Gallery
              </button>
            </div>

            <input
              type="file"
              accept="image/*"
              ref={uploadInputRef}
              style={{ display: "none" }}
              onChange={(e) => handleFileSelected(e.target.files[0])}
            />
          </>
        )}

        {stage === "camera" && (
          <div className="imgsearch-camera">
            <video ref={videoRef} autoPlay playsInline className="imgsearch-video" />
            <canvas ref={canvasRef} style={{ display: "none" }} />

            <div className="imgsearch-camera-controls">
              <button className="imgsearch-option-btn" onClick={capturePhoto}>
                📸 Capture
              </button>
              <button
                className="imgsearch-retry-btn"
                onClick={() => {
                  stopCamera();
                  setStage("choose");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {stage === "loading" && (
          <div className="imgsearch-loading">
            {previewUrl && (
              <img src={previewUrl} alt="preview" className="imgsearch-preview" />
            )}
            <div className="imgsearch-spinner" />
            <p>Reading the cover...</p>
          </div>
        )}

        {stage === "results" && (
          <div className="imgsearch-results">
            {previewUrl && (
              <img src={previewUrl} alt="preview" className="imgsearch-preview-small" />
            )}

            <p className="imgsearch-error">
              {errorMsg || "Couldn't identify this book — try a clearer photo"}
            </p>

            <button className="imgsearch-retry-btn" onClick={resetToChoose}>
              Try Another Photo
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
