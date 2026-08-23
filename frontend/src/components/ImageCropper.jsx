import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useRef, useState } from "react";
import "./ImageCropper.css";

export default function ImageCropper({
  rawImageSrc,
  aspect = 1,
  outputFileName = "image.jpg",
  title = "Crop Image",
  subtitle = "Drag to adjust.",
  onCropComplete,
  onCancel,
}) {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  if (!rawImageSrc) return null;

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    const centeredCrop = centerCrop(
      makeAspectCrop({ unit: "%", width: 80 }, aspect, width, height),
      width,
      height
    );
    setCrop(centeredCrop);
  }

  function handleCropDone() {
    if (!completedCrop || !imgRef.current) return;

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob((blob) => {
      const croppedFile = new File([blob], outputFileName, { type: "image/jpeg" });
      onCropComplete(croppedFile, canvas.toDataURL("image/jpeg"));
    }, "image/jpeg", 0.95);
  }

  return (
    <div className="crop-overlay">
      <div className="crop-modal">
        <div className="crop-modal-header">
          <h3><i className="fas fa-crop-alt"></i> {title}</h3>
          <p>{subtitle}</p>
        </div>

        <div className="crop-canvas-wrap">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            minWidth={50}
            circularCrop={aspect === 1}
          >
            <img
              ref={imgRef}
              src={rawImageSrc}
              alt="Crop preview"
              onLoad={onImageLoad}
              className="crop-source-img"
            />
          </ReactCrop>
        </div>

        <div className="crop-actions">
          <button type="button" className="btn-crop-done" onClick={handleCropDone}>
            <i className="fas fa-check"></i> Use This Crop
          </button>
          <button type="button" className="btn-crop-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
