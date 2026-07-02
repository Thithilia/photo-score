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
    case 'water-bottle':
      return (
        <>
          <path d="M50 18h20v8H50z" fill="var(--ill-accent)" {...filledStroke} />
          <path d="M46 26h28v42H46z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M51 39h18v16H51z" fill="var(--ill-soft)" {...filledStroke} />
          <path d="M54 33h12M54 61h12" {...stroke} />
        </>
      );
    case 'yogurt-cup':
      return (
        <>
          <path d="M39 25h42v8H39z" fill="var(--ill-accent)" {...filledStroke} />
          <path d="M42 33h36l-6 35H48z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M69 15l16 21" {...stroke} />
          <path d="M52 48h16M54 58h12" {...stroke} />
        </>
      );
    case 'bao-bun':
      return (
        <>
          <path d="M32 55c5-22 50-22 56 0v12H32z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M47 45c4-5 9-5 13 0M61 43c5-5 11-4 14 1" {...stroke} />
          <path d="M48 20v10M60 15v12M72 20v10" {...stroke} />
        </>
      );
    case 'french-fries':
      return (
        <>
          <path d="M44 18l5 29M57 15l1 32M70 18l-5 29M82 21l-9 26" {...stroke} />
          <path d="M37 40h46l-7 31H44z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M47 54h26" {...stroke} />
        </>
      );
    case 'salad-bowl':
      return (
        <>
          <path d="M32 44h56L78 66H42z" fill="var(--ill-main)" {...filledStroke} />
          <circle cx="47" cy="39" fill="var(--ill-accent)" r="6" />
          <circle cx="60" cy="35" fill="var(--ill-soft)" r="7" />
          <circle cx="73" cy="39" fill="var(--ill-accent)" r="6" />
          <path d="M48 51h25M44 59h32" {...stroke} />
        </>
      );
    case 'pho-bowl':
      return (
        <>
          <path d="M31 42h58L78 66H42z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M38 38h44" {...stroke} />
          <path d="M42 27c8 7 17-3 25 5M50 18v12M64 16v12M78 18v12" {...stroke} />
          <path d="M78 23l21 13M82 18l21 13" {...stroke} />
        </>
      );
    case 'com-tam':
      return (
        <>
          <path d="M27 30h66v37H27z" fill="var(--ill-soft)" {...filledStroke} />
          <circle cx="51" cy="49" fill="var(--ill-main)" r="15" {...filledStroke} />
          <path d="M66 38h16v20H66z" fill="var(--ill-accent)" {...filledStroke} />
          <path d="M24 24v42M96 28v34M47 44h8M45 53h11" {...stroke} />
        </>
      );
    case 'takoyaki':
      return (
        <>
          <path d="M30 31h60v35H30z" fill="var(--ill-soft)" {...filledStroke} />
          <circle cx="45" cy="45" fill="var(--ill-main)" r="10" {...filledStroke} />
          <circle cx="60" cy="52" fill="var(--ill-main)" r="10" {...filledStroke} />
          <circle cx="75" cy="45" fill="var(--ill-main)" r="10" {...filledStroke} />
          <path d="M40 43h10M55 50h10M70 43h10" {...stroke} />
        </>
      );
    case 'burger':
      return (
        <>
          <path d="M32 39c7-20 49-20 56 0z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M31 42h58v9H31z" fill="var(--ill-accent)" {...filledStroke} />
          <path d="M35 53h50v10H35z" fill="var(--ill-soft)" {...filledStroke} />
          <path d="M39 64h42v7H39z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M49 31h5M61 28h5M73 32h5" {...stroke} />
        </>
      );
    case 'banh-xeo':
      return (
        <>
          <path d="M26 55c15-28 52-33 68 0z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M35 55h50M47 44l8 8M61 40l7 10M75 45l-9 8" {...stroke} />
          <path d="M39 64h42" {...stroke} />
        </>
      );
    case 'spaghetti':
      return (
        <>
          <path d="M27 31h66v36H27z" fill="var(--ill-soft)" {...filledStroke} />
          <path d="M43 47c7-10 25 10 34-1M42 54c11-9 24 8 36-1M45 40c9-7 20 7 29 0" {...stroke} />
          <circle cx="61" cy="48" fill="var(--ill-accent)" r="6" />
          <path d="M91 24v42M84 25v13M90 25v13M96 25v13" {...stroke} />
        </>
      );
    case 'ramen-bowl':
      return (
        <>
          <path d="M31 42h58L79 67H41z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M38 38h44M45 49c9-7 21 7 30 0" {...stroke} />
          <circle cx="52" cy="53" fill="var(--ill-soft)" r="7" {...filledStroke} />
          <circle cx="52" cy="53" fill="var(--ill-accent)" r="3" />
          <path d="M78 21l21 13M82 16l21 13M47 19v11M60 15v12M73 19v11" {...stroke} />
        </>
      );
    case 'dessert-box':
      return (
        <>
          <path d="M31 35h58v34H31z" fill="var(--ill-soft)" {...filledStroke} />
          <path d="M31 28h58v10H31z" fill="var(--ill-accent)" {...filledStroke} />
          <path d="M42 45h14v14H42zM64 45h14v14H64z" fill="var(--ill-main)" {...filledStroke} />
          <path d="M49 39v26M71 39v26" {...stroke} />
        </>
      );
    case 'bbq-combo':
      return (
        <>
          <path d="M28 36h64v28H28z" fill="var(--ill-soft)" {...filledStroke} />
          <path d="M36 36v28M48 36v28M60 36v28M72 36v28M84 36v28" {...stroke} />
          <path d="M37 24l45 36M48 22l45 36" {...stroke} />
          <path d="M44 29h13v8H44zM63 43h13v8H63z" fill="var(--ill-main)" {...filledStroke} />
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
