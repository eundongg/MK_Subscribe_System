import { useState } from "react";

const emptyForm = () => ({
  product_name: "",
  description: "",
  price: "",
  duration_months: "",
  image: null,
});

/**
 * 관리자 전용 — 상품 등록 (multipart: 필드 + 선택 이미지)
 */
export function AdminProductRegisterModal({ onClose, onRegistered }) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const name = String(form.product_name || "").trim();
    const price = Number(form.price);
    const months = Number(form.duration_months);

    if (!name) {
      setError("상품 이름을 입력해 주세요.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError("가격을 올바르게 입력해 주세요.");
      return;
    }
    if (!Number.isFinite(months) || months < 1 || months > 120) {
      setError("구독 기간은 1~120개월 사이로 입력해 주세요.");
      return;
    }

    const fd = new FormData();
    fd.append("product_name", name);
    fd.append("description", String(form.description ?? "").trim());
    fd.append("price", String(Math.round(price)));
    fd.append("duration_months", String(Math.round(months)));
    if (form.image instanceof File && form.image.size > 0) {
      fd.append("image", form.image);
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "상품 등록에 실패했습니다.");
      }
      onRegistered?.(data);
      setForm(emptyForm());
      onClose?.();
    } catch (err) {
      console.error(err);
      setError(err.message || "상품 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="confirm-modal admin-product-register-modal" onClick={(ev) => ev.stopPropagation()}>
        <h2>상품 등록</h2>
        <p className="confirm-help-text admin-product-register-lead">
          상품 이름·설명·가격·구독 기간을 입력하고, 필요하면 이미지를 첨부하세요.
        </p>
        <form className="admin-product-register-form" onSubmit={handleSubmit}>
          <label className="signup-field">
            상품 이름
            <input
              type="text"
              value={form.product_name}
              onChange={(ev) => handleChange("product_name", ev.target.value)}
              placeholder="예: 매경e신문"
              autoComplete="off"
              maxLength={255}
            />
          </label>
          <label className="signup-field">
            설명
            <textarea
              value={form.description}
              onChange={(ev) => handleChange("description", ev.target.value)}
              placeholder="상품 소개 문구"
              rows={4}
            />
          </label>
          <div className="admin-product-register-row">
            <label className="signup-field">
              가격 (원)
              <input
                type="number"
                min={0}
                step={1}
                value={form.price}
                onChange={(ev) => handleChange("price", ev.target.value)}
                placeholder="0"
              />
            </label>
            <label className="signup-field">
              구독 기간 (개월)
              <input
                type="number"
                min={0}
                max={120}
                step={1}
                value={form.duration_months}
                onChange={(ev) => handleChange("duration_months", ev.target.value)}
                placeholder="12"
              />
            </label>
          </div>
          <label className="signup-field">
            상품 이미지 (선택)
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={(ev) => {
                const file = ev.target.files?.[0];
                handleChange("image", file || null);
              }}
            />
            <span className="admin-product-register-file-hint">JPEG, PNG, GIF, WebP · 최대 약 3MB</span>
          </label>
          {error ? <p className="field-error">{error}</p> : null}
          <div className="confirm-actions">
            <button type="button" className="btn-modal-cancel" onClick={onClose} disabled={submitting}>
              취소
            </button>
            <button type="submit" className="btn-modal-confirm" disabled={submitting}>
              {submitting ? "등록 중…" : "등록하기"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
