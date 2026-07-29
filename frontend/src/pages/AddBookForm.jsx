import axios from "axios";
import "./AddBookForm.css";
import { useState } from "react";
import ImageCropper from "../components/ImageCropper";

export default function AddBookForm({ onBookAdded, bookToEdit }) {
  const isEditMode = !!bookToEdit;

  const [form, setForm] = useState({
    title: bookToEdit?.book?.title || "",
    author: bookToEdit?.book?.author || "",
    edition: bookToEdit?.book?.edition || "",
    price: bookToEdit?.price || "",
    condition: bookToEdit?.condition || "",
    category: bookToEdit?.book?.category || "",
  });

  const [coverImage, setCoverImage] = useState(null);
  const [preview, setPreview] = useState(
    bookToEdit?.coverImage
      ? `http://localhost:5000${bookToEdit.coverImage}`
      : null
  );
  const [rawImageSrc, setRawImageSrc] = useState(null); // controls cropper visibility
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors({ ...errors, image: "Please select a valid image file." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, image: "Image must be under 5MB." });
      return;
    }

    setErrors({ ...errors, image: "" });

    const reader = new FileReader();
    reader.onloadend = () => {
      setRawImageSrc(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function handleCropComplete(croppedFile, previewDataUrl) {
    setCoverImage(croppedFile);
    setPreview(previewDataUrl);
    setRawImageSrc(null);
  }

  function handleRemoveImage() {
    setCoverImage(null);
    setPreview(
      bookToEdit?.coverImage
        ? `http://localhost:5000${bookToEdit.coverImage}`
        : null
    );
  }

  function validate() {
    const newErrors = {};
    if (!form.title.trim())    newErrors.title     = "Book title is required.";
    if (!form.author.trim())   newErrors.author    = "Author name is required.";
    if (!form.price)           newErrors.price     = "Price is required.";
    if (form.price <= 0)       newErrors.price     = "Price must be greater than 0.";
    if (!form.condition)       newErrors.condition = "Please select a condition.";
    if (!form.category)        newErrors.category  = "Please select a category.";
    if (!isEditMode && !coverImage) newErrors.image = "Please upload a cover image.";
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const foundErrors = validate();
    if (Object.keys(foundErrors).length > 0) {
      setErrors(foundErrors);
      return;
    }

    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    try {
      setStatus("loading");

      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("author", form.author);
      formData.append("edition", form.edition);
      formData.append("price", form.price);
      formData.append("condition", form.condition);
      formData.append("category", form.category);
      formData.append("shopLocation", user.location);
      if (coverImage) formData.append("coverImage", coverImage);

      if (isEditMode) {
        await axios.put(
          `http://localhost:5000/api/books/${bookToEdit._id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        await axios.post(
          "http://localhost:5000/api/books/",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      setStatus("success");

      setTimeout(() => {
        setForm({ title: "", author: "", edition: "", price: "", condition: "", category: "" });
        setCoverImage(null);
        setPreview(null);
        setStatus("");
        onBookAdded();
      }, 2000);

    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  }

  const categoryOptions = [
    "Fiction",
    "Non-Fiction",
    "Science & Technology",
    "Mathematics",
    "History",
    "Biography & Memoir",
    "Religion & Spirituality",
    "Self-Help",
    "Business & Economics",
    "Medical & Health",
    "Law",
    "Engineering",
    "Computer Science",
    "Arts & Literature",
    "Children's Books",
    "Comics & Graphic Novels",
    "Language & Linguistics",
    "Travel & Geography",
    "Politics & Society",
    "Other",
  ];

  return (
    <div className="add-book-form-wrapper">
      <div className="form-card-header">
        <h2>{isEditMode ? "Edit Book" : "Add New Book"}</h2>
        <p>{isEditMode ? "Update the details below." : "Fill in the details below to list your book."}</p>
      </div>

      {status === "success" && (
        <div className="form-success">
          <i className="fas fa-check-circle"></i>
          {isEditMode ? "Book updated successfully 🎉" : "Book listed successfully 🎉"}
        </div>
      )}
      {status === "error" && (
        <div className="form-error">❌ Something went wrong. Try again.</div>
      )}
      {status === "loading" && (
        <div className="form-loading">
          {isEditMode ? "⏳ Updating your book..." : "⏳ Listing your book..."}
        </div>
      )}

      <form onSubmit={handleSubmit} className="add-book-form">
        <div className="form-grid">

          <div className="form-group">
            <label htmlFor="title">Book Title <span className="required">*</span></label>
            <input
              id="title" name="title" type="text"
              placeholder="e.g. The Great Gatsby"
              value={form.title} onChange={handleChange}
            />
            {errors.title && <span className="field-error">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="author">Author Name <span className="required">*</span></label>
            <input
              id="author" name="author" type="text"
              placeholder="e.g. F. Scott Fitzgerald"
              value={form.author} onChange={handleChange}
            />
            {errors.author && <span className="field-error">{errors.author}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="edition">Edition <span className="optional">(optional)</span></label>
            <input
              id="edition" name="edition" type="text"
              placeholder="e.g. 2nd Edition, 2019"
              value={form.edition} onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">Price (Rs.) <span className="required">*</span></label>
            <input
              id="price" name="price" type="number"
              placeholder="e.g. 450" min="1"
              value={form.price} onChange={handleChange}
            />
            {errors.price && <span className="field-error">{errors.price}</span>}
          </div>

          <div className="form-group form-full">
            <label htmlFor="category">Category <span className="required">*</span></label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              className="category-select"
              style={{ color: form.category === "" ? "#64748b" : "#f8fafc"}}
            >
              <option value="" disabled>Select a category...</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <span className="field-error">{errors.category}</span>}
          </div>

          <div className="form-group form-full">
            <label htmlFor="condition">Condition <span className="required">*</span></label>
            <div className="condition-options">
              {[
                { value: "new",      label: "New",      desc: "Unused, sealed" },
                { value: "like-new", label: "Like New", desc: "No marks or damage" },
                { value: "good",     label: "Good",     desc: "Minor wear only" },
                { value: "fair",     label: "Fair",     desc: "Visible wear, readable" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`condition-card ${form.condition === opt.value ? "selected" : ""}`}
                >
                  <input
                    type="radio" name="condition" value={opt.value}
                    checked={form.condition === opt.value}
                    onChange={handleChange}
                  />
                  <span className="condition-label">{opt.label}</span>
                  <span className="condition-desc">{opt.desc}</span>
                </label>
              ))}
            </div>
            {errors.condition && <span className="field-error">{errors.condition}</span>}
          </div>

          <div className="form-group form-full">
            <label>
              Book Cover Image{" "}
              {isEditMode
                ? <span className="optional">(optional — leave as is to keep current)</span>
                : <span className="required">*</span>
              }
            </label>
            {preview ? (
              <div className="image-preview-wrapper">
                <img src={preview} alt="Cover preview" className="image-preview" />
                <div className="preview-info">
                  {coverImage && (
                    <>
                      <p className="preview-filename">{coverImage.name}</p>
                      <p className="preview-size">{(coverImage.size / 1024).toFixed(1)} KB</p>
                    </>
                  )}
                  <div className="preview-btn-row">
                    <div className="preview-btn-stack">
                      <button
                        type="button"
                        className="btn-change-image"
                        onClick={() => setRawImageSrc(preview)}
                      >
                        <i className="fas fa-crop-alt"></i> Re-crop
                      </button>

                      <label htmlFor="cover-upload" className="btn-change-image">
                        <i className="fas fa-upload"></i> Change Image
                        <input
                          id="cover-upload" type="file" accept="image/*"
                          onChange={handleImageChange} style={{ display: "none" }}
                        />
                      </label>
                    </div>

                    <button type="button" className="btn-remove-image" onClick={handleRemoveImage}>
                      <i className="fas fa-trash"></i> Remove Image
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label className="upload-area" htmlFor="cover-upload">
                <i className="fas fa-cloud-upload-alt"></i>
                <p>Click to upload or drag and drop</p>
                <small>PNG, JPG up to 5MB</small>
                <input
                  id="cover-upload" type="file" accept="image/*"
                  onChange={handleImageChange} style={{ display: "none" }}
                />
              </label>
            )}
            {errors.image && <span className="field-error">{errors.image}</span>}
          </div>

        </div>

        <div className="form-actions">
          <button type="submit" className="btn-orange btn-submit" disabled={status === "loading"}>
            <i className={isEditMode ? "fas fa-save" : "fas fa-plus"}></i>
            {status === "loading" ? " Please wait..." : isEditMode ? " Save Changes" : " List Book"}
          </button>
          <button
            type="button" className="btn-reset"
            onClick={() => {
              setForm({ title: "", author: "", edition: "", price: "", condition: "", category: "" });
              setCoverImage(null);
              setPreview(null);
              setErrors({});
            }}
          >
            Reset
          </button>
        </div>
      </form>

      <ImageCropper
        rawImageSrc={rawImageSrc}
        aspect={2 / 3}
        outputFileName="cover.jpg"
        title="Crop Cover Image"
        subtitle="Drag to adjust. Default ratio is 2:3 (book cover)."
        onCropComplete={handleCropComplete}
        onCancel={() => setRawImageSrc(null)}
      />
    </div>
  );
}
