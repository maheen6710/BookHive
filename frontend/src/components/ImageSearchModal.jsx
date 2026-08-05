import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import "./ImageSearchModal.css";

// STAGES: "choose" -> "loading" -> "results"
export default function ImageSearchModal({ onClose }) {
  const [stage, setStage] = useState("choose");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const navigate = useNavigate();

  const uploadInputRef = useRef(null);

  const handleFileSelected = async (file) => {
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setStage("loading");
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("coverImage", file);

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
              Upload a photo of a book cover and we'll find it for you
            </p>

            <div className="imgsearch-options">
              <button
                className="imgsearch-option-btn"
                onClick={() => uploadInputRef.current.click()}
              >
                🖼️ Upload a Photo
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
