export default function WeaponSelector({ weapons, selected, onSelect, disabled = false }) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
        {weapons.map((w, i) => (
          <button
            key={w}
            disabled={disabled}
            style={{ 
              border: selected === i ? '2px solid red' : '1px solid gray',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1
            }}
            onClick={() => onSelect(i)}
          >
            {w}
          </button>
        ))}
      </div>
    );
  }
  