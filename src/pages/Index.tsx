import QrScanner from '@/components/QrScanner';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            QR 코드 웹 스캐너
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            카메라로 QR 코드를 스캔하여 웹사이트에 바로 접속하세요. 
            여러 카메라가 있는 경우 원하는 카메라를 선택할 수 있습니다.
          </p>
        </div>
        
        <QrScanner />
        
        <div className="mt-12 text-center">
          <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-3">사용 방법</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>1. 카메라 권한을 허용해주세요</p>
              <p>2. 여러 카메라가 있다면 원하는 카메라를 선택하세요</p>
              <p>3. "스캔 시작" 버튼을 클릭하세요</p>
              <p>4. QR 코드를 카메라에 비춰주세요</p>
              <p>5. 자동으로 웹사이트가 열립니다</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
