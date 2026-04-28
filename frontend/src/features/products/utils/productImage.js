import { PRODUCT_IMAGE_MAP } from "../../../constants/productImageMap";

const FALLBACK = "/image/매경e신문.png";

/** API의 image_url이 있으면 우선, 없으면 상품명 매핑·기본 이미지 */
export function getProductImageSrc(product) {
  if (!product) {
    return FALLBACK;
  }
  const url = product.image_url;
  if (typeof url === "string" && url.trim()) {
    return url.trim();
  }
  return PRODUCT_IMAGE_MAP[product.product_name] || FALLBACK;
}
