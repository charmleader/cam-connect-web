import QrScanner from '@/components/QrScanner';
import UrlShortener from '@/components/UrlShortener';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            QR 도구 웹앱
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            QR 코드 스캔, URL 단축, QR 코드 생성까지! 모든 QR 관련 작업을 한 곳에서 처리하세요.
          </p>
        </div>
        
        <Tabs defaultValue="scanner" className="w-full max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="scanner">QR 스캐너</TabsTrigger>
            <TabsTrigger value="shortener">URL 단축 + QR 생성</TabsTrigger>
          </TabsList>
          
          <TabsContent value="scanner" className="space-y-8">
            <QrScanner />
            
            <div className="text-center">
              <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 max-w-md mx-auto">
                <h3 className="text-lg font-semibold mb-3">QR 스캔 방법</h3>
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
          </TabsContent>
          
          <TabsContent value="shortener" className="space-y-8">
            <UrlShortener />
            
            <div className="text-center">
              <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 max-w-md mx-auto">
                <h3 className="text-lg font-semibold mb-3">URL 단축 + QR 생성</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>🔗 <strong>URL 단축:</strong> 긴 URL을 짧고 공유하기 쉬운 형태로 변환</p>
                  <p>📱 <strong>QR 코드 생성:</strong> 단축된 URL의 QR 코드 자동 생성</p>
                  <p>📋 <strong>복사 기능:</strong> 원본 URL과 단축 URL 원클릭 복사</p>
                  <p>⬇️ <strong>QR 다운로드:</strong> 생성된 QR 코드 PNG 파일로 저장</p>
                  <p>📊 <strong>중복 방지:</strong> 동일 URL은 기존 단축 URL 재사용</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
