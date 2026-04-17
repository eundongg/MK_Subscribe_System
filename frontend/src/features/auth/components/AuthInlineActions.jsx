export function AuthInlineActions({ currentUser, onLogin, onSignup, onLogout }) {
  return (
    <div className="auth-inline-links">
      {currentUser ? (
        <>
          <span className="auth-user-text">{currentUser.name}님</span>
          <button type="button" className="text-link-btn" onClick={onLogout}>
            로그아웃
          </button>
        </>
      ) : (
        <>
          <button type="button" className="text-link-btn" onClick={onLogin}>
            로그인
          </button>
          <button type="button" className="text-link-btn" onClick={onSignup}>
            회원가입
          </button>
        </>
      )}
    </div>
  );
}
