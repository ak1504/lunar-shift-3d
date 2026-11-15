const RESOURCE_META = {
  oxygen: { label: 'OXYGEN', icon: '◉', tone: 'cyan', unit: '%' },
  water: { label: 'WATER', icon: '◆', tone: 'blue', unit: '%' },
  food: { label: 'FOOD', icon: '✦', tone: 'green', unit: '%' },
  power: { label: 'POWER', icon: 'ϟ', tone: 'amber', unit: '%' }
};

export default function ResourceMeter({ type, value }) {
  const meta = RESOURCE_META[type];
  const status = value < 20 ? 'critical' : value < 40 ? 'low' : 'normal';
  return (
    <div className={`resource-meter ${meta.tone} ${status}`}>
      <div className="meter-topline">
        <span className="meter-icon">{meta.icon}</span>
        <span className="meter-label">{meta.label}</span>
        <strong>{Math.round(value)}{meta.unit}</strong>
      </div>
      <div className="meter-track"><div className="meter-fill" style={{ width: `${value}%` }} /></div>
      <span className="meter-status">{status === 'critical' ? 'CRITICAL' : status === 'low' ? 'LOW RESERVE' : 'NOMINAL'}</span>
    </div>
  );
}
