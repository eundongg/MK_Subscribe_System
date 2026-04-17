import { useEffect, useState } from "react";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loadError, setLoadError] = useState("");

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

  return (
    <section className="list-container">
      <header>
        <h1>회원 조회 리스트</h1>
        <span className="count-badge">총 {users.length} 명</span>
      </header>
      {loadError ? <p className="field-error">{loadError}</p> : null}
      <table>
        <thead>
          <tr>
            <th>No.</th>
            <th>이름</th>
            <th>아이디</th>
            <th>가입일</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user, index) => (
              <tr key={user.member_no ?? index}>
                <td>{index + 1}</td>
                <td className="user-name">{user.name}</td>
                <td>
                  <span className="login-id">{user.login_id}</span>
                </td>
                <td style={{ color: "#999", fontSize: 13 }}>
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} style={{ textAlign: "center", padding: 50, color: "#ccc" }}>
                {loadError ? "위 안내를 확인해 주세요." : "등록된 회원이 없습니다."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

export default UsersPage;
