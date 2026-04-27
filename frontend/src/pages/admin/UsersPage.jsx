import { useEffect, useState } from "react";

const STATUS_LABEL = {
  ACTIVE: "활성",
  SLEEP: "휴면",
  DELETED: "정지",
};

const STATUS_OPTIONS = [
  { value: "ALL", label: "전체 상태" },
  { value: "ACTIVE", label: "활성" },
  { value: "DORMANT", label: "휴면" },
  { value: "SUSPENDED", label: "정지" },
];

const ROLE_OPTIONS = [
  { value: "ALL", label: "전체 권한" },
  { value: "ADMIN", label: "관리자" },
  { value: "USER", label: "일반회원" },
];

function UsersPage() {
  const toUiStatus = (status) => {
    const s = String(status || "").toUpperCase();
    if (s === "INACTIVE") return "DORMANT";
    if (s === "SLEEP") return "DORMANT";
    if (s === "DELETED") return "SUSPENDED";
    return s;
  };

  const [users, setUsers] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/users", { credentials: "include" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          console.error(data?.message || response.statusText);
          setLoadError(
            response.status === 401
              ? "관리자 데이터를 보려면 로그인이 필요합니다. 상품 페이지에서 로그인한 뒤 다시 시도해 주세요."
              : data?.message || "회원 목록을 불러오지 못했습니다."
          );
          setUsers([]);
          return;
        }
        setLoadError("");
        setUsers(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error(err);
        setLoadError("회원 목록을 불러오지 못했습니다.");
        setUsers([]);
      });
  }, []);

  const filteredUsers = users.filter((user) => {
    const q = keyword.trim().toLowerCase();
    const byKeyword =
      q === "" ||
      String(user.name || "")
        .toLowerCase()
        .includes(q) ||
      String(user.login_id || "")
        .toLowerCase()
        .includes(q);
    const byStatus = statusFilter === "ALL" || toUiStatus(user.status) === statusFilter;
    const byRole =
      roleFilter === "ALL" ||
      (roleFilter === "ADMIN" ? Boolean(user.is_admin) : !Boolean(user.is_admin));
    return byKeyword && byStatus && byRole;
  });

  const openUserDetail = async (memberNo) => {
    setDetailLoading(true);
    setDetailError("");
    setSaveMessage("");
    try {
      const response = await fetch(`/api/admin/users/${memberNo}`, { credentials: "include" });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "회원 상세를 불러오지 못했습니다.");
      }
      setSelectedUser(data);
      setEditStatus(toUiStatus(data?.user?.status || "ACTIVE"));
      setEditIsAdmin(Boolean(data?.user?.is_admin));
    } catch (err) {
      setDetailError(err.message || "회원 상세를 불러오지 못했습니다.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
    setDetailError("");
    setSaveMessage("");
  };

  const saveUserSettings = async () => {
    if (!selectedUser?.user?.member_no) {
      return;
    }
    setSaveLoading(true);
    setSaveMessage("");
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.user.member_no}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          is_admin: editIsAdmin,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "상태/권한 저장에 실패했습니다.");
      }
      const updated = data?.user;
      setUsers((prev) =>
        prev.map((u) => (u.member_no === updated.member_no ? { ...u, ...updated } : u))
      );
      setSelectedUser((prev) => (prev ? { ...prev, user: { ...prev.user, ...updated } } : prev));
      setSaveMessage("저장되었습니다.");
    } catch (err) {
      setSaveMessage(err.message || "상태/권한 저장에 실패했습니다.");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <section className="list-container">
      <header>
        <h1>회원 조회 리스트</h1>
        <span className="count-badge">총 {filteredUsers.length} 명</span>
      </header>
      {loadError ? <p className="field-error">{loadError}</p> : null}
      <div className="admin-user-toolbar">
        <input
          type="text"
          className="admin-user-search"
          placeholder="이름 또는 아이디 검색"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>No.</th>
            <th>이름</th>
            <th>아이디</th>
            <th>상태</th>
            <th>권한</th>
            <th>가입일</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user, index) => (
              <tr
                key={user.member_no ?? index}
                className="admin-user-row"
                onClick={() => openUserDetail(user.member_no)}
              >
                <td>{index + 1}</td>
                <td className="user-name">{user.name}</td>
                <td>
                  <span className="login-id">{user.login_id}</span>
                </td>
                <td>
                  <span className={`admin-user-status status-${String(user.status || "").toLowerCase()}`}>
                    {STATUS_LABEL[String(user.status || "").toUpperCase()] || user.status || "-"}
                  </span>
                </td>
                <td>{user.is_admin ? "관리자" : "일반회원"}</td>
                <td style={{ color: "#999", fontSize: 13 }}>
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", padding: 50, color: "#ccc" }}>
                {loadError ? "위 안내를 확인해 주세요." : "등록된 회원이 없습니다."}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {detailLoading ? (
        <div className="modal-backdrop">
          <section className="confirm-modal">
            <p className="confirm-help-text">회원 상세를 불러오는 중…</p>
          </section>
        </div>
      ) : null}

      {selectedUser ? (
        <div className="modal-backdrop" onClick={closeModal}>
          <section className="confirm-modal" onClick={(event) => event.stopPropagation()}>
            <h2>회원 상세 조회</h2>
            <div className="admin-user-detail-grid">
              <div>
                <p className="admin-user-detail-label">이름</p>
                <p className="admin-user-detail-value">{selectedUser.user?.name || "-"}</p>
              </div>
              <div>
                <p className="admin-user-detail-label">아이디</p>
                <p className="admin-user-detail-value">{selectedUser.user?.login_id || "-"}</p>
              </div>
              <div>
                <p className="admin-user-detail-label">가입일</p>
                <p className="admin-user-detail-value">
                  {selectedUser.user?.created_at
                    ? new Date(selectedUser.user.created_at).toLocaleDateString("ko-KR")
                    : "-"}
                </p>
              </div>
              <div>
                <p className="admin-user-detail-label">활성 구독</p>
                <p className="admin-user-detail-value">
                  {Number(selectedUser.user?.active_subscription_count || 0).toLocaleString()}개
                </p>
              </div>
              <div>
                <p className="admin-user-detail-label">결제 건수</p>
                <p className="admin-user-detail-value">
                  {Number(selectedUser.user?.payment_count || 0).toLocaleString()}건
                </p>
              </div>
              <div>
                <p className="admin-user-detail-label">누적 결제 금액</p>
                <p className="admin-user-detail-value">
                  {Number(selectedUser.user?.total_paid || 0).toLocaleString()}원
                </p>
              </div>
            </div>

            <div className="admin-user-active-products">
              <p className="admin-user-detail-label">활성 구독 상품</p>
              <p className="confirm-help-text">
                {(selectedUser.activeProducts || []).length > 0
                  ? selectedUser.activeProducts.map((p) => `${p.product_name}(${p.active_count})`).join(", ")
                  : "현재 활성 구독 상품이 없습니다."}
              </p>
            </div>

            <div className="admin-user-edit-row">
              <label className="signup-field">
                상태
                <select value={editStatus} onChange={(event) => setEditStatus(event.target.value)}>
                  {STATUS_OPTIONS.filter((opt) => opt.value !== "ALL").map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="signup-check">
                <input
                  type="checkbox"
                  checked={editIsAdmin}
                  onChange={(event) => setEditIsAdmin(event.target.checked)}
                />
                관리자 권한
              </label>
            </div>
            {detailError ? <p className="field-error">{detailError}</p> : null}
            {saveMessage ? (
              <p className={saveMessage === "저장되었습니다." ? "field-success" : "field-error"}>{saveMessage}</p>
            ) : null}
            <div className="confirm-actions">
              <button type="button" className="btn-modal-cancel" onClick={closeModal}>
                닫기
              </button>
              <button
                type="button"
                className="btn-modal-confirm"
                onClick={saveUserSettings}
                disabled={saveLoading}
              >
                {saveLoading ? "저장 중..." : "상태/권한 저장"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

export default UsersPage;
