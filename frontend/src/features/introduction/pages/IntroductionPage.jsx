export default function IntroductionPage() {
  const services = [
    {
      badge: "E",
      title: "매경e신문",
      summary: "종이신문의 핵심 구성을 디지털로 빠르게 확인합니다.",
      tags: ["매일 업데이트", "핵심 기사"],
    },
    {
      badge: "W",
      title: "매경이코노미",
      summary: "경제, 산업, 투자 이슈를 주간 단위로 깊이 있게 살핍니다.",
      tags: ["심층 분석", "주간 인사이트"],
    },
    {
      badge: "L",
      title: "럭스맨",
      summary: "라이프스타일, 트렌드, 인터뷰 중심의 프리미엄 콘텐츠를 제공합니다.",
      tags: ["라이프스타일", "프리미엄"],
    },
    {
      badge: "R",
      title: "구독 리포트",
      summary: "결제 내역, 이용 기간, 만료 시점까지 한 화면에서 관리할 수 있습니다.",
      tags: ["결제 내역", "기간 확인"],
    },
  ];

  const faqs = [
    {
      question: "Q. 상품은 몇 개까지 선택해서 비교할 수 있나요?",
      answer: "A. 상품 페이지에서 최대 2개까지 선택해 묶음 정보와 할인 가격을 확인할 수 있습니다.",
    },
    {
      question: "Q. 구독 기간은 언제부터 시작되나요?",
      answer: "A. 결제가 완료된 시점을 기준으로 상품별 이용 기간이 즉시 적용됩니다.",
    },
    {
      question: "Q. 내 구독 상태는 어디서 확인하나요?",
      answer: "A. 결제 리포트와 구독 히스토리 화면에서 상품별 상태를 확인할 수 있습니다.",
    },
  ];

  return (
    <section className="intro-page">
      <section className="intro-hero">
        <p className="intro-eyebrow">MAEKYUNG SUBSCRIPTION</p>
        <h1>매경 구독 서비스 이용 안내</h1>
        <p>
          필요한 상품을 선택하고, 결제 내역과 구독 기간을 한 번에 관리할 수 있습니다. 현재 제공 중인 서비스를
          아래에서 확인해 보세요.
        </p>
      </section>

      <section className="intro-section">
        <div className="intro-section-head">
          <h2>이용 가능한 서비스</h2>
        </div>
        <div className="intro-service-grid">
          {services.map((service) => (
            <article key={service.title} className="intro-service-card">
              <span className="intro-service-badge" aria-hidden>
                {service.badge}
              </span>
              <div className="intro-service-body">
                <h3>{service.title}</h3>
                <p>{service.summary}</p>
                <div className="intro-tag-list">
                  {service.tags.map((tag) => (
                    <span key={tag} className="intro-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="intro-section">
        <div className="intro-section-head">
          <h2>FAQ</h2>
        </div>
        <div className="intro-faq-list">
          {faqs.map((item) => (
            <article key={item.question} className="intro-faq-item">
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
