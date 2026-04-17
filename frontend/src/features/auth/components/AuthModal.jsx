export function AuthModal({
  authMode,
  authMessage,
  signupForm,
  loginForm,
  idCheck,
  passwordMatches,
  canProceedSignup,
  canProceedLogin,
  passwordMinLength,
  onClose,
  onChangeSignupField,
  onChangeLoginField,
  onCheckLoginId,
  onSignup,
  onLogin,
}) {
  if (!authMode) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="confirm-modal" onClick={(event) => event.stopPropagation()}>
        <h2>{authMode === "signup" ? "회원가입" : "로그인"}</h2>
        {authMode === "signup" ? (
          <>
            <p className="confirm-help-text">회원 정보를 입력해 계정을 만들어 주세요.</p>
            <div className="signup-fields">
              <label className="signup-field">
                등록 아이디
                <div className="inline-field-row">
                  <input
                    type="text"
                    value={signupForm.loginId}
                    onChange={(event) => onChangeSignupField("loginId", event.target.value)}
                    placeholder="아이디를 입력하세요"
                  />
                  <button type="button" className="btn-modal-cancel" onClick={onCheckLoginId}>
                    중복 확인
                  </button>
                </div>
                {idCheck.status === "available" ? <p className="field-success">{idCheck.message}</p> : null}
                {idCheck.status === "taken" || idCheck.status === "error" ? (
                  <p className="field-error">{idCheck.message}</p>
                ) : null}
              </label>
              <label className="signup-field">
                비밀번호
                <input
                  type="password"
                  value={signupForm.password}
                  onChange={(event) => onChangeSignupField("password", event.target.value)}
                  placeholder="비밀번호를 입력하세요"
                />
                <p className="password-rules">
                  {passwordMinLength}자 이상, 공백 없음, 영문(또는 한글)과 숫자를 함께 포함해야 합니다.
                </p>
              </label>
              <label className="signup-field">
                비밀번호 확인
                <input
                  type="password"
                  value={signupForm.passwordConfirm}
                  onChange={(event) => onChangeSignupField("passwordConfirm", event.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
                />
                {signupForm.passwordConfirm.length > 0 && !passwordMatches ? (
                  <p className="field-error">비밀번호가 일치하지 않습니다.</p>
                ) : null}
                {signupForm.passwordConfirm.length > 0 && passwordMatches ? (
                  <p className="field-success">비밀번호가 일치합니다.</p>
                ) : null}
              </label>
              <label className="signup-field">
                이름
                <input
                  type="text"
                  value={signupForm.name}
                  onChange={(event) => onChangeSignupField("name", event.target.value)}
                  placeholder="이름을 입력하세요"
                />
              </label>
              <label className="signup-check">
                <input
                  type="checkbox"
                  checked={signupForm.isOver14}
                  onChange={(event) => onChangeSignupField("isOver14", event.target.checked)}
                />
                만 14세 이상입니다.
              </label>
              <label className="signup-check">
                <input
                  type="checkbox"
                  checked={signupForm.agreeSignup}
                  onChange={(event) => onChangeSignupField("agreeSignup", event.target.checked)}
                />
                위 정보로 회원가입 및 이용약관에 동의합니다.
              </label>
            </div>
          </>
        ) : (
          <>
            <p className="confirm-help-text">구독을 진행하려면 로그인해 주세요.</p>
            <div className="signup-fields">
              <label className="signup-field">
                아이디
                <input
                  type="text"
                  value={loginForm.loginId}
                  onChange={(event) => onChangeLoginField("loginId", event.target.value)}
                  placeholder="아이디를 입력하세요"
                />
              </label>
              <label className="signup-field">
                비밀번호
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => onChangeLoginField("password", event.target.value)}
                  placeholder="비밀번호를 입력하세요"
                />
              </label>
            </div>
          </>
        )}
        {authMessage ? <p className="field-error">{authMessage}</p> : null}
        <div className="confirm-actions">
          <button type="button" className="btn-modal-cancel" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className="btn-modal-confirm"
            disabled={authMode === "signup" ? !canProceedSignup : !canProceedLogin}
            onClick={authMode === "signup" ? onSignup : onLogin}
          >
            {authMode === "signup" ? "회원가입" : "로그인"}
          </button>
        </div>
      </section>
    </div>
  );
}
