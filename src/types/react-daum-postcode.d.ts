declare module 'react-daum-postcode' {
  export interface Address {
    zonecode: string;
    address: string;
    addressEnglish: string;
    addressType: 'R' | 'J';
    userSelectedType: 'R' | 'J';
    noSelected: 'Y' | 'N';
    userLanguageType: 'K' | 'E';
    roadAddress: string;
    roadAddressEnglish: string;
    jibunAddress: string;
    jibunAddressEnglish: string;
    autoRoadAddress: string;
    autoRoadAddressEnglish: string;
    autoJibunAddress: string;
    autoJibunAddressEnglish: string;
    buildingCode: string;
    buildingName: string;
    apartment: 'Y' | 'N';
    sido: string;
    sidoEnglish: string;
    sigungu: string;
    sigunguEnglish: string;
    sigunguCode: string;
    roadnameCode: string;
    bcode: string;
    roadname: string;
    roadnameEnglish: string;
    bname: string;
    bnameEnglish: string;
    bname1: string;
    bname1English: string;
    bname2: string;
    bname2English: string;
    hname: string;
    query: string;
  }

  export interface DaumPostcodeProps {
    onComplete: (data: Address) => void;
    onClose?: () => void;
    onSearch?: (data: Address) => void;
    width?: string | number;
    height?: string | number;
    autoClose?: boolean;
    autoResize?: boolean;
    animation?: boolean;
    defaultQuery?: string;
    theme?: object;
    style?: React.CSSProperties;
    scriptUrl?: string;
    errorMessage?: React.ReactNode;
  }

  const DaumPostcode: React.FC<DaumPostcodeProps>;
  export default DaumPostcode;
} 