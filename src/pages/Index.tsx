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
            카메라로 실시간 QR 코드 스캔하거나, QR 코드 이미지를 업로드하여 웹사이트에 바로 접속하세요. 
            여러 카메라가 있는 경우 원하는 카메라를 선택할 수 있습니다.
          </p>
        </div>
        
        <QrScanner />
        
        <div className="mt-12 text-center">
          <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-3">사용 방법</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>📷 <strong>카메라 스캔:</strong> 실시간으로 QR 코드를 스캔</p>
              <p>🖼️ <strong>이미지 업로드:</strong> 3가지 방법으로 QR 코드 이미지 업로드</p>
              <p>　　• 클릭하여 파일 선택</p>
              <p>　　• 드래그 앤 드롭으로 이미지 끌어다 놓기</p>
              <p>　　• Ctrl+V (Windows) / Cmd+V (Mac)로 클립보드에서 붙여넣기</p>
              <p>🎯 카메라가 여러 개라면 원하는 카메라를 선택하세요</p>
              <p>🔗 스캔된 URL로 자동으로 새 탭이 열립니다</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
