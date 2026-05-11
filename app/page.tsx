import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center py-16 space-y-6">
        <div className="inline-block bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full">
          AI 기반 사주명리 분석 플랫폼
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
          당신의 사주로 읽는<br />
          <span className="text-indigo-600">삶의 패턴과 타이밍</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          3,000년 명리학의 지혜와 최신 AI를 결합하여 당신의 타고난 기질, 적성, 인간관계 패턴을 분석합니다.
          단순한 운세가 아닌, 데이터 기반 자기 이해와 의사결정 지원 도구입니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/new"
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-lg"
          >
            무료로 사주 분석하기 →
          </Link>
        </div>
        <p className="text-sm text-gray-400">가입 없이 바로 사용 가능 · 분석 시간 약 30초</p>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-6">
        {[
          {
            icon: '四',
            title: '사주팔자 정밀 계산',
            desc: '양력/음력 자동 변환, 절기 기반 월주 계산, 60갑자 정확도로 四柱를 계산합니다.',
          },
          {
            icon: '五',
            title: '오행 분포 분석',
            desc: '천간·지지·지장간 가중치를 반영한 정밀 오행 분포로 일간의 강약을 판단합니다.',
          },
          {
            icon: 'AI',
            title: 'AI 해석 보고서',
            desc: '계산된 사주 데이터를 AI가 해석하여 성격·직업·인간관계·대운 보고서를 생성합니다.',
          },
        ].map((f, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-3">
            <div className="text-3xl font-bold text-indigo-600">{f.icon}</div>
            <h3 className="font-semibold text-gray-900">{f.title}</h3>
            <p className="text-sm text-gray-600">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* What is Saju */}
      <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">사주명리학이란?</h2>
        <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
          <div className="space-y-3">
            <p>사주명리학(四柱命理學)은 태어난 연(年)·월(月)·일(日)·시(時)의 네 기둥(四柱)에 담긴 천간(天干)과 지지(地支)의 조합을 통해 개인의 타고난 기질과 삶의 패턴을 분석하는 동양 철학입니다.</p>
            <p>이 앱은 전통 명리학의 계산 체계를 완전히 구현한 사주 엔진 위에, AI 해석 레이어를 결합했습니다. 계산은 항상 결정론적이며, AI는 오직 해석만 수행합니다.</p>
          </div>
          <div className="space-y-2">
            {[
              ['四柱 (사주)', '年·月·日·時 네 기둥'],
              ['八字 (팔자)', '8개의 간지 글자'],
              ['五行 (오행)', '木·火·土·金·水 다섯 원소'],
              ['十星 (십성)', '일간과의 관계로 정의된 10개 성분'],
              ['大運 (대운)', '10년 단위 운의 흐름'],
            ].map(([term, desc]) => (
              <div key={term} className="flex gap-3">
                <span className="font-semibold text-indigo-600 w-24 shrink-0">{term}</span>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-8">
        <Link
          href="/new"
          className="bg-indigo-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors inline-block"
        >
          지금 내 사주 분석하기
        </Link>
      </section>
    </div>
  )
}
