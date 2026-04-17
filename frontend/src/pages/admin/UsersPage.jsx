import { useEffect, useState } from "react";

function UsersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((response) => response.json())
      .then(setUsers)
      .catch((err) => {
        console.error(err);
        setUsers([]);
      });
  }, []);

  return (
    <section className="list-container">
      <header>
        <h1>회원 조회 리스트</h1>
        <span className="count-badge">총 {users.length} 명</span>
      </header>
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
                등록된 회원이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

export default UsersPage;
