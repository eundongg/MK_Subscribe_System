import { Navigate, useParams } from "react-router-dom";

export function LegacyPaymentRedirect() {
  const { id } = useParams();
  return <Navigate to={`/admin/payments?payment=${encodeURIComponent(id)}`} replace />;
}
