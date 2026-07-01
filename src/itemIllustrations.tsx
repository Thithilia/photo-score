type StoreIllustrationCategory = 'food' | 'furniture' | 'clothes';

interface StoreItemIllustrationProps {
  itemId: string;
  category: StoreIllustrationCategory;
  title: string;
}

const stroke = {
  fill: 'none',
  stroke: 'var(--line)',
  strokeWidth: 3,
  vectorEffect: 'non-scaling-stroke' as const,
};

const filledStroke = {
  stroke: 'var(--line)',
  strokeWidth: 3,
  vectorEffect: 'non-scaling-stroke' as const,
};

export function StoreItemIllustration({
  itemId,
  category,
  title,
}: StoreItemIllustrationProps) {
  return (
    <svg
      aria-label={`Minh họa ${title}`}
      className={`item-illustration item-illustration-${category}`}
      role="img"
      viewBox="0 0 120 88"
    >
      <rect className="item-illustration-bg" height="88" width="120" x="0" y="0" />
      {renderIllustration(itemId, category)}
    </svg>
  );
}

function renderIllustration(itemId: string, category: StoreIllustrationCategory) {
  switch (itemId) {
    case 'coffee':
      return (
        <>
          <path d="M42 34h34v26H42z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M76 40h12v13H76" {...stroke} />
          <path d="M36 64h50" {...stroke} />
          <path d="M46 17v11M58 13v14M70 17v11" {...stroke} />
        </>
      );
    case 'sweet-cake':
      return (
        <>
          <path d="M34 45h52v20H34z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M42 30h36v15H42z" fill="var(--ill-soft)" {...filledStroke} />
          <path d="M50 20h20v10H50z" fill="var(--ill-accent)" {...filledStroke} />
          <path d="M45 55h8M60 55h8M75 55h6" {...stroke} />
        </>
      );
    case 'dinner':
      return (
        <>
          <path d="M32 25h56v39H32z" fill="var(--ill-soft)" {...filledStroke} />
          <path d="M45 37h30v16H45z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M24 28v36M96 28v36M20 43h8M92 43h8" {...stroke} />
        </>
      );
    case 'milk-tea':
      return (
        <>
          <path d="M44 25h34l-5 43H49z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M52 38h18" {...stroke} />
          <path d="M66 14l20 18" {...stroke} />
          <circle cx="55" cy="59" fill="var(--ill-accent)" r="3" />
          <circle cx="64" cy="60" fill="var(--ill-accent)" r="3" />
          <circle cx="70" cy="54" fill="var(--ill-accent)" r="3" />
        </>
      );
    case 'banh-mi':
      return (
        <>
          <path d="M27 48l18-18h36l14 18-15 15H42z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M43 44l8-7M58 44l8-7M73 44l8-7" {...stroke} />
          <path d="M38 56h45" {...stroke} />
        </>
      );
    case 'noodle-bowl':
      return (
        <>
          <path d="M33 43h54l-9 22H42z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M38 39h44" {...stroke} />
          <path d="M45 28c7 9 19 0 26 9M45 19l45 11M50 15l45 11" {...stroke} />
        </>
      );
    case 'fruit-cup':
      return (
        <>
          <path d="M40 32h40l-6 34H46z" fill="var(--ill-soft)" {...filledStroke} />
          <circle cx="48" cy="29" fill="var(--ill-accent)" r="7" />
          <circle cx="62" cy="27" fill="var(--ill-main)" r="7" />
          <circle cx="75" cy="30" fill="var(--ill-accent)" r="6" />
          <path d="M50 50h20M52 58h17" {...stroke} />
        </>
      );
    case 'ice-cream':
      return (
        <>
          <path d="M49 42h24L61 70z" fill="var(--ill-soft)" {...filledStroke} />
          <circle cx="61" cy="32" fill="var(--ill-main)" r="17" {...filledStroke} />
          <path d="M54 53h14M57 61h8" {...stroke} />
        </>
      );
    case 'fried-chicken':
      return (
        <>
          <path d="M43 33h25l13 15-12 15H43L31 48z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M68 52l20 13M85 62l8-5M85 62l2 9" {...stroke} />
          <path d="M43 43h21" {...stroke} />
        </>
      );
    case 'pizza-slice':
      return (
        <>
          <path d="M32 22l60 12-44 37z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M36 26l52 10" {...stroke} />
          <circle cx="54" cy="43" fill="var(--ill-accent)" r="4" />
          <circle cx="66" cy="51" fill="var(--ill-accent)" r="4" />
          <circle cx="48" cy="57" fill="var(--ill-accent)" r="3" />
        </>
      );
    case 'sushi-set':
      return (
        <>
          <path d="M30 28h24v20H30zM66 28h24v20H66zM48 53h24v20H48z" fill="var(--ill-soft)" {...filledStroke} />
          <path d="M38 34h8v8h-8zM74 34h8v8h-8zM56 59h8v8h-8z" fill="var(--ill-accent)" {...filledStroke} />
        </>
      );
    case 'hotpot-mini':
      return (
        <>
          <path d="M30 39h60v25H30z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M38 31h44v8H38z" fill="var(--ill-soft)" {...filledStroke} />
          <path d="M24 48h6M90 48h6M43 22v8M60 18v12M77 22v8" {...stroke} />
        </>
      );
    case 'steak-plate':
      return (
        <>
          <path d="M27 28h66v36H27z" fill="var(--ill-soft)" {...filledStroke} />
          <path d="M42 38l25-8 15 12-9 15H49z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M52 45h21" {...stroke} />
        </>
      );
    case 'seafood-pot':
      return (
        <>
          <path d="M31 40h58v23H31z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M38 34h44v6H38z" fill="var(--ill-soft)" {...filledStroke} />
          <path d="M46 51h12l8-6 8 6h-12l-8 6z" fill="var(--ill-accent)" {...filledStroke} />
          <path d="M42 24v8M60 20v12M78 24v8" {...stroke} />
        </>
      );
    case 'lamp':
      return (
        <>
          <path d="M45 22h30l-7 22H52z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M60 44v22M46 66h28" {...stroke} />
        </>
      );
    case 'chair':
      return (
        <>
          <path d="M42 26h36v28H42z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M35 54h50v12H35z" fill="var(--ill-soft)" {...filledStroke} />
          <path d="M43 66v10M77 66v10" {...stroke} />
        </>
      );
    case 'bookshelf':
      return (
        <>
          <path d="M34 18h52v56H34z" fill="var(--ill-soft)" {...filledStroke} />
          <path d="M34 36h52M34 55h52M46 22v14M60 40v15M73 59v15" {...stroke} />
          <path d="M40 23h8v13H40zM52 41h9v14H52zM66 60h9v14H66z" fill="var(--ill-main)" />
        </>
      );
    case 'plant-pot':
      return (
        <>
          <path d="M45 50h30l-5 22H50z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M60 50V27M60 36l-18-10M60 38l18-12M60 44l-22 1M60 45l22 1" {...stroke} />
        </>
      );
    case 'floor-mat':
      return (
        <>
          <path d="M25 32h70v32H25z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M35 40h50M35 49h50M35 58h50" {...stroke} />
        </>
      );
    case 'wall-clock':
      return (
        <>
          <circle cx="60" cy="44" fill="var(--ill-soft)" r="27" {...filledStroke} />
          <path d="M60 24v5M60 59v5M40 44h5M75 44h5M60 44V31M60 44l13 8" {...stroke} />
        </>
      );
    case 'bedside-table':
      return (
        <>
          <path d="M39 27h42v43H39z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M39 44h42M55 36h10M55 58h10" {...stroke} />
        </>
      );
    case 'round-table':
      return (
        <>
          <circle cx="60" cy="38" fill="var(--ill-main)" r="24" {...filledStroke} />
          <path d="M60 62v14M43 76h34" {...stroke} />
        </>
      );
    case 'sofa-small':
      return (
        <>
          <path d="M30 43h60v22H30z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M38 28h44v24H38z" fill="var(--ill-soft)" {...filledStroke} />
          <path d="M30 51H20v14h10M90 51h10v14H90M41 65v8M79 65v8" {...stroke} />
        </>
      );
    case 'standing-lamp':
      return (
        <>
          <path d="M48 16h24l8 24H40z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M60 40v33M45 73h30" {...stroke} />
        </>
      );
    case 'wardrobe':
      return (
        <>
          <path d="M35 17h50v58H35z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M60 17v58M52 46h4M64 46h4" {...stroke} />
        </>
      );
    case 'study-desk':
      return (
        <>
          <path d="M28 38h64v12H28z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M37 50v24M83 50v24M44 25h32v13H44z" fill="var(--ill-soft)" {...filledStroke} />
        </>
      );
    case 'vanity-table':
      return (
        <>
          <path d="M42 17h36v28H42z" fill="var(--ill-soft)" {...filledStroke} />
          <path d="M31 48h58v12H31z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M40 60v14M80 60v14M52 56h16" {...stroke} />
        </>
      );
    case 'double-bed':
      return (
        <>
          <path d="M24 41h72v28H24z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M24 27h72v18H24z" fill="var(--ill-soft)" {...filledStroke} />
          <path d="M36 33h18M66 33h18M24 69v7M96 69v7" {...stroke} />
        </>
      );
    case 'window-curtain':
      return (
        <>
          <path d="M31 17h58v45H31z" fill="var(--ill-soft)" {...filledStroke} />
          <path d="M26 17h68M45 17v45M75 17v45" {...stroke} />
          <path d="M31 20l14 42M89 20L75 62" fill="var(--ill-main)" {...filledStroke} />
        </>
      );
    case 'cap':
      return (
        <>
          <path d="M37 47c3-17 15-27 31-24 13 3 21 12 22 25H37z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M52 48h46l-12 13H45z" fill="var(--ill-soft)" {...filledStroke} />
        </>
      );
    case 'shirt':
      return (
        <>
          <path d="M43 23l17 9 17-9 18 18-13 12-6-6v28H44V47l-6 6-13-12z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M52 34h16" {...stroke} />
        </>
      );
    case 'jacket':
      return (
        <>
          <path d="M42 22h36l16 19-12 12-6-6v29H44V47l-6 6-12-12z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M60 25v50M49 41h9M63 41h9" {...stroke} />
        </>
      );
    default:
      return (
        <>
          <path
            d={category === 'furniture' ? 'M35 35h50v32H35z' : 'M34 31h52v34H34z'}
            fill="var(--ill-main)"
            {...filledStroke}
          />
          <path d="M44 44h32M44 55h22" {...stroke} />
        </>
      );
  }
}
