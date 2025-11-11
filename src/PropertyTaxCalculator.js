import React, { useState } from 'react';
import './PropertyTaxCalculator.css';

const PropertyTaxCalculator = () => {
  // 현재 기준값
  const CURRENT_REALITY_RATE = 69; // 현실화율 69%
  const CURRENT_FAIR_MARKET_RATE = 60; // 공정시장가액비율 60%
  const CURRENT_ONE_HOUSE_FAIR_MARKET_RATE = 45; // 1주택자 공정시장가액비율 45%

  // 상태 관리
  const [marketValue, setMarketValue] = useState(''); // 부동산 시가 (입력값 - 숫자만)
  const [displayPrice, setDisplayPrice] = useState(''); // 화면 표시용 (콤마 포함)
  const [realityRate, setRealityRate] = useState(CURRENT_REALITY_RATE); // 현실화율
  const [fairMarketRate, setFairMarketRate] = useState(CURRENT_FAIR_MARKET_RATE); // 공정시장가액비율
  const [oneHouseFairMarketRate, setOneHouseFairMarketRate] = useState(CURRENT_ONE_HOUSE_FAIR_MARKET_RATE); // 1주택자 공정시장가액비율
  const [isInfoOpen, setIsInfoOpen] = useState(false); // 기본 정보 토글 상태
  const [activeTab, setActiveTab] = useState('multi'); // 'multi' or 'single' - 탭 상태

  // 세율 테이블 (누진세율 - 2주택 이상)
  // baseTax: 해당 구간 이전까지의 누적 세액
  // rate: 해당 구간 초과분에 적용할 세율 (1,000분의 N)
  const taxRates = [
    { min: 0, max: 60000000, rate: 0.001, baseTax: 0 },
    { min: 60000000, max: 150000000, rate: 0.0015, baseTax: 60000 },
    { min: 150000000, max: 300000000, rate: 0.0025, baseTax: 195000 },
    { min: 300000000, max: Infinity, rate: 0.004, baseTax: 570000 }
  ];

  // 1주택자 특례세율 테이블
  // baseTax: 해당 구간 이전까지의 누적 세액
  // rate: 해당 구간 초과분에 적용할 세율 (1,000분의 N)
  const oneHouseTaxRates = [
    { min: 0, max: 60000000, rate: 0.0005, baseTax: 0 },
    { min: 60000000, max: 150000000, rate: 0.001, baseTax: 30000 },
    { min: 150000000, max: 300000000, rate: 0.002, baseTax: 120000 },
    { min: 300000000, max: Infinity, rate: 0.0035, baseTax: 420000 }
  ];

  // 과세표준에 따른 세액 계산 (구간별 누진세)
  const calculateTaxFromBase = (taxBase, ratesTable = taxRates) => {
    if (!taxBase || taxBase <= 0) return 0;

    for (let bracket of ratesTable) {
      if (taxBase > bracket.min && taxBase <= bracket.max) {
        // 기본세액 + (과표 - 구간 시작금액) × 세율
        const tax = bracket.baseTax + ((taxBase - bracket.min) * bracket.rate);
        return { tax, rate: bracket.rate };
      }
    }
    return { tax: 0, rate: 0 };
  };

  // 주택가격 계산 (시가로부터)
  // 주택가격 = 시가 × 현실화율
  const calculateAssessedValue = (marketVal, realRate) => {
    if (!marketVal || marketVal <= 0) return 0;
    return marketVal * (realRate / 100);
  };

  // 재산세 계산 (2주택 이상)
  const calculateTax = (marketValue, realRate, fairRate) => {
    if (!marketValue || marketValue <= 0) return {
      marketValue: 0,
      assessedValue: 0,
      taxBase: 0,
      tax: 0,
      effectiveRate: 0
    };

    // 주택가격 산정 = 시가 × 현실화율
    const assessedValue = marketValue * (realRate / 100);

    // 과세표준 = 주택가격 × 공정시장가액비율
    const taxBase = assessedValue * (fairRate / 100);

    // 세액 계산 (구간별 누진세)
    const { tax, rate } = calculateTaxFromBase(taxBase);

    return {
      marketValue,
      assessedValue,
      taxBase,
      tax: Math.max(0, tax),
      effectiveRate: rate
    };
  };

  // 1주택자 재산세 계산 (9억원 한도 적용)
  const calculateOneHouseTax = (marketValue, realRate, fairRate) => {
    if (!marketValue || marketValue <= 0) return {
      marketValue: 0,
      assessedValue: 0,
      taxBase: 0,
      taxBaseCapped: 0,
      tax: 0,
      effectiveRate: 0,
      isCapped: false
    };

    // 주택가격 산정 = 시가 × 현실화율
    const assessedValue = marketValue * (realRate / 100);

    // 과세표준 = 주택가격 × 공정시장가액비율
    let taxBase = assessedValue * (fairRate / 100);

    // 9억원 한도 적용 (1주택자 특례)
    const NINE_HUNDRED_MILLION = 900000000;
    const isCapped = taxBase > NINE_HUNDRED_MILLION;
    const taxBaseCapped = isCapped ? NINE_HUNDRED_MILLION : taxBase;

    // 1주택자 특례세율 적용 (구간별 누진세)
    const { tax, rate } = calculateTaxFromBase(taxBaseCapped, oneHouseTaxRates);

    return {
      marketValue,
      assessedValue,
      taxBase,
      taxBaseCapped,
      tax: Math.max(0, tax),
      effectiveRate: rate,
      isCapped
    };
  };

  // 입력값 파싱
  const inputMarketValue = parseFloat(marketValue) || 0;

  // 2주택 이상 계산
  // 현재 설정으로 계산 (변경된 현실화율과 공정시장가액비율 적용)
  const currentCalc = calculateTax(inputMarketValue, realityRate, fairMarketRate);

  // 기존 기준으로 계산 (비교용 - 현재 기준 그대로)
  const baseCalc = calculateTax(inputMarketValue, CURRENT_REALITY_RATE, CURRENT_FAIR_MARKET_RATE);

  // 세액 증감
  const taxDifference = currentCalc.tax - baseCalc.tax;
  const taxDifferencePercent = baseCalc.tax > 0
    ? ((taxDifference / baseCalc.tax) * 100).toFixed(2)
    : 0;

  // 1주택자 계산
  // 현재 설정으로 계산 (변경된 현실화율과 공정시장가액비율 적용)
  const currentOneHouseCalc = calculateOneHouseTax(inputMarketValue, realityRate, oneHouseFairMarketRate);

  // 기존 기준으로 계산 (비교용 - 현재 기준 그대로)
  const baseOneHouseCalc = calculateOneHouseTax(inputMarketValue, CURRENT_REALITY_RATE, CURRENT_ONE_HOUSE_FAIR_MARKET_RATE);

  // 1주택자 세액 증감
  const oneHouseTaxDifference = currentOneHouseCalc.tax - baseOneHouseCalc.tax;
  const oneHouseTaxDifferencePercent = baseOneHouseCalc.tax > 0
    ? ((oneHouseTaxDifference / baseOneHouseCalc.tax) * 100).toFixed(2)
    : 0;

  // 숫자 포맷팅
  const formatNumber = (num) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  // 숫자를 한글로 변환
  const numberToKorean = (num) => {
    if (!num || num === 0) return '영원';

    const numRounded = Math.round(num);
    const units = ['', '만', '억', '조'];
    const smallUnits = ['', '십', '백', '천'];

    let result = '';
    let unitIndex = 0;

    // 4자리씩 끊어서 처리
    let tempNum = numRounded;
    while (tempNum > 0) {
      const part = tempNum % 10000;
      if (part > 0) {
        let partStr = '';
        let partTemp = part;
        let smallUnitIndex = 0;

        while (partTemp > 0) {
          const digit = partTemp % 10;
          if (digit > 0) {
            const digitStr = digit === 1 && smallUnitIndex > 0 ? '' : ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'][digit];
            partStr = digitStr + smallUnits[smallUnitIndex] + partStr;
          }
          partTemp = Math.floor(partTemp / 10);
          smallUnitIndex++;
        }

        result = partStr + units[unitIndex] + result;
      }
      tempNum = Math.floor(tempNum / 10000);
      unitIndex++;
    }

    return result + '원';
  };

  // 입력값 처리 핸들러
  const handlePriceInput = (e) => {
    const value = e.target.value;
    // 숫자와 콤마만 허용
    const numbersOnly = value.replace(/[^\d]/g, '');

    // 숫자 값 저장
    setMarketValue(numbersOnly);

    // 콤마 포함 표시값 저장
    if (numbersOnly) {
      setDisplayPrice(formatNumber(parseFloat(numbersOnly)));
    } else {
      setDisplayPrice('');
    }
  };

  // 세율 테이블 표시용
  const getTaxBracketDisplay = (bracket) => {
    if (bracket.max === Infinity) {
      return `${formatNumber(bracket.min)}원 초과`;
    }
    return `${formatNumber(bracket.min)}원 초과 ${formatNumber(bracket.max)}원 이하`;
  };

  return (
    <div className="calculator-container">
      <h1>주택가격 시세에 따른 재산세액 알아보기</h1>

      {/* 정보 및 세율 테이블 통합 섹션 */}
      <div className="info-tax-wrapper">
        <div className="warning-notice">
          <span className="warning-icon">⚠️</span>
          <div className="warning-text">
            <span>테스트 중입니다. 세액 계산 검증하지 않았습니다.</span>
            <span>과표상한 등 규정을 반영하지 않았습니다.</span>
          </div>
        </div>
        <div className="info-tax-title" onClick={() => setIsInfoOpen(!isInfoOpen)}>
          <span>기본 정보</span>
          <span className={`toggle-icon ${isInfoOpen ? 'open' : 'closed'}`}>
            {isInfoOpen ? '▼' : '▶'}
          </span>
        </div>
        {isInfoOpen && (
          <div className="info-tax-content">
            <div className="info-box">
              <h3>재산세 계산 과정</h3>
              <ul>
                <li>주택가격 산정 = 시가 × 현실화율 (현재 {CURRENT_REALITY_RATE}%)</li>
                <li>과세표준 산정 = 주택가격 × 공정시장가액비율 (현재 {CURRENT_FAIR_MARKET_RATE}%)</li>
                <li>세액 = 과세표준 × 누진세율 - 누진공제액</li>
              </ul>
            </div>

            {/* 세율 테이블 */}
            <div className="tax-table">
              <h3>주택 재산세 세율표</h3>
              <table>
                <thead>
                  <tr>
                    <th>과세표준</th>
                    <th>세율</th>
                  </tr>
                </thead>
                <tbody>
                  {taxRates.map((bracket, index) => (
                    <tr key={index}>
                      <td>{getTaxBracketDisplay(bracket)}</td>
                      <td>
                        {bracket.rate === 0.1 ? '1,000분의 1' :
                          bracket.rate === 0.15 ? '60,000원+6천만원 초과금액의 1,000분의 1.5' :
                            bracket.rate === 0.25 ? '195,000원+1억5천만원 초과금액의 1,000분의 2.5' :
                              '570,000원+3억원 초과금액의 1,000분의 4'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 입력 및 슬라이더 통합 섹션 */}
      <div className="input-slider-wrapper">
        {/* 입력 섹션 */}
        <div className="input-section">
          <div className="input-header">
            <div className="input-title-section">
              <h3>우리집 시세</h3>
            </div>
            <div className="input-description">
              <p>부동산의 시가를 입력하세요. 주택가격은 현실화율을 적용하여 계산됩니다.</p>
            </div>
          </div>
          <div className="input-content">
            <div className="input-group">
              <input
                type="text"
                value={displayPrice}
                onChange={handlePriceInput}
                placeholder="시가를 입력하세요 (예: 1,300,000,000)"
                className="price-input"
              />
              <span className="unit">원</span>
            </div>
            {marketValue && (
              <div className="calculated-market-value">
                <span className="label">현재 기준 주택가격:</span>
                <span className="value">
                  {formatNumber(calculateAssessedValue(inputMarketValue, CURRENT_REALITY_RATE))}원
                  <span className="korean-amount"> ({numberToKorean(calculateAssessedValue(inputMarketValue, CURRENT_REALITY_RATE))})</span>
                </span>
                <span className="info">(시가 × 현실화율 {CURRENT_REALITY_RATE}%)</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 계산 결과 - 탭으로 통합 */}
      <div className="results-section">
          <div className="tab-container">
            <button
              className={`tab-button ${activeTab === 'multi' ? 'active' : ''}`}
              onClick={() => setActiveTab('multi')}
            >
              1세대 2주택 이상
            </button>
            <button
              className={`tab-button ${activeTab === 'single' ? 'active' : ''}`}
              onClick={() => setActiveTab('single')}
            >
              1세대 1주택 (특례세율)
            </button>
          </div>

          {activeTab === 'multi' && (
          <div className="horizontal-scroll-wrapper">
            <div className="result-comparison">
              <div className="result-card base-result">
                <h4>현재 기준 (현실화율 {CURRENT_REALITY_RATE}% / 공정시장가액비율 {CURRENT_FAIR_MARKET_RATE}%)</h4>
                <div className="result-item">
                  <span className="label">입력 시가:</span>
                  <span className="value">{formatNumber(inputMarketValue)}원</span>
                </div>
                <div className="result-item">
                  <span className="label">주택가격 (현 기준):</span>
                  <span className="value">{formatNumber(baseCalc.assessedValue)}원</span>
                </div>
                <div className="result-item">
                  <span className="label">과세표준:</span>
                  <span className="value">{formatNumber(baseCalc.taxBase)}원</span>
                </div>
                <div className="result-item total">
                  <span className="label">재산세:</span>
                  <span className="value">{formatNumber(baseCalc.tax)}원</span>
                </div>
              </div>

              {/* 슬라이더 섹션 */}
              <div className="slider-section">
                <div className="slider-group vertical">
                  <div className="slider-header">
                    <h4>현실화율: {realityRate}%</h4>
                    <span className="slider-info">
                      (현재 기준: {CURRENT_REALITY_RATE}%)
                    </span>
                  </div>
                  <div className="slider-container">
                    <div className="slider-labels vertical">
                      <span>100%</span>
                      <span>50%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={realityRate}
                      onChange={(e) => setRealityRate(parseFloat(e.target.value))}
                      className="slider vertical"
                      orient="vertical"
                    />
                  </div>
                </div>

                <div className="slider-group vertical">
                  <div className="slider-header">
                    <h4>공정시장가액비율: {fairMarketRate}%</h4>
                    <span className="slider-info">
                      (현재 기준: {CURRENT_FAIR_MARKET_RATE}%)
                    </span>
                  </div>
                  <div className="slider-container">
                    <div className="slider-labels vertical">
                      <span>100%</span>
                      <span>50%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={fairMarketRate}
                      onChange={(e) => setFairMarketRate(parseFloat(e.target.value))}
                      className="slider vertical"
                      orient="vertical"
                    />
                  </div>
                </div>
              </div>

              <div className="result-card current-result">
                <h4>변경 후 (현실화율 {realityRate}% / 공정시장가액비율 {fairMarketRate}%)</h4>
                <div className="result-item">
                  <span className="label">입력 시가:</span>
                  <span className="value">{formatNumber(inputMarketValue)}원</span>
                </div>
                <div className="result-item">
                  <span className="label">주택가격 (변경 기준):</span>
                  <span className="value">{formatNumber(currentCalc.assessedValue)}원</span>
                </div>
                <div className="result-item">
                  <span className="label">과세표준:</span>
                  <span className="value">{formatNumber(currentCalc.taxBase)}원</span>
                </div>
                <div className="result-item total">
                  <span className="label">재산세:</span>
                  <span className="value highlight">{formatNumber(currentCalc.tax)}원</span>
                </div>
              </div>

              {/* 증감액 표시 */}
              <div className={`tax-difference ${taxDifference >= 0 ? 'increase' : 'decrease'}`}>
                <h4>세액 변동</h4>
                <div className="difference-amount">
                  {taxDifference >= 0 ? '+' : ''}{formatNumber(taxDifference)}원
                  <span className="percentage">
                    ({taxDifference >= 0 ? '+' : ''}{taxDifferencePercent}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
          )}

          {activeTab === 'single' && (
          <div className="horizontal-scroll-wrapper">
            <div className="result-comparison">
              <div className="result-card base-result">
                <h4>현재 기준 (현실화율 {CURRENT_REALITY_RATE}% / 공정시장가액비율 {CURRENT_ONE_HOUSE_FAIR_MARKET_RATE}%)</h4>
                <div className="result-item">
                  <span className="label">입력 시가:</span>
                  <span className="value">{formatNumber(inputMarketValue)}원</span>
                </div>
                <div className="result-item">
                  <span className="label">주택가격 (현 기준):</span>
                  <span className="value">{formatNumber(baseOneHouseCalc.assessedValue)}원</span>
                </div>
                <div className="result-item">
                  <span className="label">과세표준:</span>
                  <span className="value">{formatNumber(baseOneHouseCalc.taxBaseCapped)}원</span>
                  {baseOneHouseCalc.isCapped && <span className="cap-notice">(9억원 한도)</span>}
                </div>
                <div className="result-item total">
                  <span className="label">재산세:</span>
                  <span className="value">{formatNumber(baseOneHouseCalc.tax)}원</span>
                </div>
              </div>

              {/* 슬라이더 섹션 */}
              <div className="slider-section">
                <div className="slider-group vertical">
                  <div className="slider-header">
                    <h4>현실화율: {realityRate}%</h4>
                    <span className="slider-info">
                      (현재 기준: {CURRENT_REALITY_RATE}%)
                    </span>
                  </div>
                  <div className="slider-container">
                    <div className="slider-labels vertical">
                      <span>100%</span>
                      <span>50%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={realityRate}
                      onChange={(e) => setRealityRate(parseFloat(e.target.value))}
                      className="slider vertical"
                      orient="vertical"
                    />
                  </div>
                </div>

                <div className="slider-group vertical">
                  <div className="slider-header">
                    <h4>공정시장가액비율: {oneHouseFairMarketRate}%</h4>
                    <span className="slider-info">
                      (현재 기준: {CURRENT_ONE_HOUSE_FAIR_MARKET_RATE}%)
                    </span>
                  </div>
                  <div className="slider-container">
                    <div className="slider-labels vertical">
                      <span>100%</span>
                      <span>40%</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="100"
                      value={oneHouseFairMarketRate}
                      onChange={(e) => setOneHouseFairMarketRate(parseFloat(e.target.value))}
                      className="slider vertical"
                      orient="vertical"
                    />
                  </div>
                </div>
              </div>

              <div className="result-card current-result">
                <h4>변경 후 (현실화율 {realityRate}% / 공정시장가액비율 {oneHouseFairMarketRate}%)</h4>
                <div className="result-item">
                  <span className="label">입력 시가:</span>
                  <span className="value">{formatNumber(inputMarketValue)}원</span>
                </div>
                <div className="result-item">
                  <span className="label">주택가격 (변경 기준):</span>
                  <span className="value">{formatNumber(currentOneHouseCalc.assessedValue)}원</span>
                </div>
                <div className="result-item">
                  <span className="label">과세표준:</span>
                  <span className="value">{formatNumber(currentOneHouseCalc.taxBaseCapped)}원</span>
                  {currentOneHouseCalc.isCapped && <span className="cap-notice">(9억원 한도)</span>}
                </div>
                <div className="result-item total">
                  <span className="label">재산세:</span>
                  <span className="value highlight">{formatNumber(currentOneHouseCalc.tax)}원</span>
                </div>
              </div>

              {/* 증감액 표시 */}
              <div className={`tax-difference ${oneHouseTaxDifference >= 0 ? 'increase' : 'decrease'}`}>
                <h4>세액 변동</h4>
                <div className="difference-amount">
                  {oneHouseTaxDifference >= 0 ? '+' : ''}{formatNumber(oneHouseTaxDifference)}원
                  <span className="percentage">
                    ({oneHouseTaxDifference >= 0 ? '+' : ''}{oneHouseTaxDifferencePercent}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>

      {/* 안내 메시지 */}
      {!marketValue && (
        <div className="empty-state">
          <p>부동산 시가를 입력하고 슬라이더를 조정하여 재산세 변동을 확인하세요.</p>
        </div>
      )}
    </div>
  );
};

export default PropertyTaxCalculator;
