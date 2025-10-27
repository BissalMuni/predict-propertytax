import React, { useState } from 'react';
import './PropertyTaxCalculator.css';

const PropertyTaxCalculator = () => {
  // 현재 기준값
  const CURRENT_REALITY_RATE = 69; // 현실화율 69%
  const CURRENT_FAIR_MARKET_RATE = 60; // 공정시장가액비율 60%

  // 상태 관리
  const [assessedPrice, setAssessedPrice] = useState(''); // 당해 년도 주택가격 (입력값 - 숫자만)
  const [displayPrice, setDisplayPrice] = useState(''); // 화면 표시용 (콤마 포함)
  const [realityRate, setRealityRate] = useState(CURRENT_REALITY_RATE); // 현실화율
  const [fairMarketRate, setFairMarketRate] = useState(CURRENT_FAIR_MARKET_RATE); // 공정시장가액비율
  const [isInfoOpen, setIsInfoOpen] = useState(false); // 기본 정보 토글 상태

  // 세율 테이블 (누진세율)
  const taxRates = [
    { min: 0, max: 60000000, rate: 0.1, deduction: 0 },
    { min: 60000000, max: 150000000, rate: 0.15, deduction: 3000000 },
    { min: 150000000, max: 300000000, rate: 0.25, deduction: 18000000 },
    { min: 300000000, max: Infinity, rate: 0.4, deduction: 63000000 }
  ];

  // 과세표준에 따른 세율 계산
  const calculateTaxRate = (taxBase) => {
    for (let bracket of taxRates) {
      if (taxBase > bracket.min && taxBase <= bracket.max) {
        return { rate: bracket.rate, deduction: bracket.deduction };
      }
    }
    return { rate: 0, deduction: 0 };
  };

  // 주택가격으로부터 시가 역산
  // 주택가격 = 시가 × 현실화율
  // 따라서 시가 = 주택가격 / 현실화율
  const calculateMarketValue = (assessedValue) => {
    if (!assessedValue || assessedValue <= 0) return 0;
    // 현재 기준 현실화율로 역산
    return assessedValue / (CURRENT_REALITY_RATE / 100);
  };

  // 재산세 계산
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

    // 세율 적용
    const { rate, deduction } = calculateTaxRate(taxBase);
    const tax = (taxBase * rate) - deduction;

    return {
      marketValue,
      assessedValue,
      taxBase,
      tax: Math.max(0, tax),
      effectiveRate: rate
    };
  };

  // 입력값 파싱
  const inputAssessedPrice = parseFloat(assessedPrice) || 0;

  // 입력된 주택가격으로부터 시가 계산
  const marketValue = calculateMarketValue(inputAssessedPrice);

  // 현재 설정으로 계산 (변경된 현실화율과 공정시장가액비율 적용)
  const currentCalc = calculateTax(marketValue, realityRate, fairMarketRate);

  // 기존 기준으로 계산 (비교용 - 현재 기준 그대로)
  const baseCalc = calculateTax(marketValue, CURRENT_REALITY_RATE, CURRENT_FAIR_MARKET_RATE);

  // 세액 증감
  const taxDifference = currentCalc.tax - baseCalc.tax;
  const taxDifferencePercent = baseCalc.tax > 0
    ? ((taxDifference / baseCalc.tax) * 100).toFixed(2)
    : 0;

  // 숫자 포맷팅
  const formatNumber = (num) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  // 입력값 처리 핸들러
  const handlePriceInput = (e) => {
    const value = e.target.value;
    // 숫자와 콤마만 허용
    const numbersOnly = value.replace(/[^\d]/g, '');

    // 숫자 값 저장
    setAssessedPrice(numbersOnly);

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
      <h1>주택가격 현실화에 따른 재산세액 예상하기</h1>

      {/* 정보 및 세율 테이블 통합 섹션 */}
      <div className="info-tax-wrapper">
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
              <h3>당해 년도 주택가격 입력</h3>
            </div>
            <div className="input-description">
              <p>공시된 주택가격을 입력하세요. 시가는 자동으로 계산됩니다.</p>
            </div>
          </div>
          <div className="input-group">
            <input
              type="text"
              value={displayPrice}
              onChange={handlePriceInput}
              placeholder="주택가격을 입력하세요 (예: 900,000,000)"
              className="price-input"
            />
            <span className="unit">원</span>
          </div>
          {assessedPrice && (
            <div className="calculated-market-value">
              <span className="label">역산된 시가:</span>
              <span className="value">{formatNumber(marketValue)}원</span>
              <span className="info">(주택가격 ÷ 현실화율 {CURRENT_REALITY_RATE}%)</span>
            </div>
          )}
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
                <span>60%</span>
              </div>
              <input
                type="range"
                min="60"
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
      </div>

      {/* 계산 결과 */}
      {assessedPrice && (
        <div className="results-section">
          <h3>계산 결과</h3>

          <div className="result-comparison">
            <div className="result-card base-result">
              <h4>현재 기준 (현실화율 {CURRENT_REALITY_RATE}% / 공정시장가액비율 {CURRENT_FAIR_MARKET_RATE}%)</h4>
              <div className="result-item">
                <span className="label">입력 주택가격:</span>
                <span className="value">{formatNumber(inputAssessedPrice)}원</span>
              </div>
              <div className="result-item">
                <span className="label">역산 시가:</span>
                <span className="value">{formatNumber(baseCalc.marketValue)}원</span>
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

            <div className="result-card current-result">
              <h4>변경 후 (현실화율 {realityRate}% / 공정시장가액비율 {fairMarketRate}%)</h4>
              <div className="result-item">
                <span className="label">입력 주택가격:</span>
                <span className="value">{formatNumber(inputAssessedPrice)}원</span>
              </div>
              <div className="result-item">
                <span className="label">역산 시가:</span>
                <span className="value">{formatNumber(currentCalc.marketValue)}원</span>
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
      )}

      {/* 안내 메시지 */}
      {!assessedPrice && (
        <div className="empty-state">
          <p>당해 년도 주택가격을 입력하고 슬라이더를 조정하여 재산세 변동을 확인하세요.</p>
        </div>
      )}
    </div>
  );
};

export default PropertyTaxCalculator;
