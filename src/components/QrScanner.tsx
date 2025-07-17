import { useEffect, useRef, useState } from 'react';
import QrScannerLib from 'qr-scanner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, CameraOff, ExternalLink, RefreshCw, Upload, FileImage } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Camera {
  id: string;
  label: string;
}

export default function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrScannerRef = useRef<QrScannerLib | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');
  const [scanCount, setScanCount] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [activeTab, setActiveTab] = useState('camera');
  const { toast } = useToast();

  // 카메라 목록 가져오기
  useEffect(() => {
    const getCameras = async () => {
      try {
        const cameraList = await QrScannerLib.listCameras(true);
        const formattedCameras = cameraList.map((camera, index) => ({
          id: camera.id,
          label: camera.label || `카메라 ${index + 1}`
        }));
        setCameras(formattedCameras);
        if (formattedCameras.length > 0) {
          setSelectedCamera(formattedCameras[0].id);
          setActiveTab('camera');
        } else {
          // 카메라가 없으면 파일 업로드 탭으로 기본 설정
          setActiveTab('upload');
        }
      } catch (error) {
        console.error('카메라 목록을 가져오는데 실패했습니다:', error);
        // 카메라 접근 실패시 파일 업로드 탭으로 설정
        setActiveTab('upload');
      }
    };

    getCameras();
  }, []);

  // QR 스캐너 초기화 (카메라 모드용)
  useEffect(() => {
    if (!videoRef.current || !selectedCamera || activeTab !== 'camera') return;

    const video = videoRef.current;
    
    const qrScanner = new QrScannerLib(
      video,
      (result) => {
        handleQrResult(result.data);
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        preferredCamera: selectedCamera,
        maxScansPerSecond: 2,
      }
    );

    qrScannerRef.current = qrScanner;

    return () => {
      qrScanner.destroy();
    };
  }, [selectedCamera, activeTab]);

  // QR 결과 처리 공통 함수
  const handleQrResult = (data: string) => {
    if (data !== lastResult) {
      setLastResult(data);
      setScanCount(prev => prev + 1);
      
      toast({
        title: 'QR 코드 감지!',
        description: `URL: ${data}`,
      });

      // URL 유효성 검사
      try {
        const url = new URL(data);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          // 새 탭에서 URL 열기
          window.open(data, '_blank', 'noopener,noreferrer');
        } else {
          toast({
            title: '유효하지 않은 URL',
            description: '웹 URL만 지원됩니다.',
            variant: 'destructive'
          });
        }
      } catch {
        toast({
          title: '유효하지 않은 URL',
          description: '올바른 URL 형식이 아닙니다.',
          variant: 'destructive'
        });
      }
    }
  };

  const startScanning = async () => {
    if (!qrScannerRef.current) return;

    try {
      await qrScannerRef.current.start();
      setIsScanning(true);
      toast({
        title: '스캔 시작',
        description: 'QR 코드를 카메라에 비춰주세요.'
      });
    } catch (error) {
      console.error('스캔 시작 실패:', error);
      toast({
        title: '스캔 오류',
        description: '카메라를 시작할 수 없습니다.',
        variant: 'destructive'
      });
    }
  };

  const stopScanning = () => {
    if (!qrScannerRef.current) return;

    qrScannerRef.current.stop();
    setIsScanning(false);
    toast({
      title: '스캔 중지',
      description: '스캔이 중지되었습니다.'
    });
  };

  const changeCamera = async (cameraId: string) => {
    setSelectedCamera(cameraId);
    if (qrScannerRef.current && isScanning) {
      try {
        await qrScannerRef.current.setCamera(cameraId);
        toast({
          title: '카메라 변경',
          description: '카메라가 변경되었습니다.'
        });
      } catch (error) {
        console.error('카메라 변경 실패:', error);
        toast({
          title: '카메라 변경 실패',
          description: '선택한 카메라로 변경할 수 없습니다.',
          variant: 'destructive'
        });
      }
    }
  };

  // 파일 업로드 처리
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 타입 검사
    if (!file.type.startsWith('image/')) {
      toast({
        title: '잘못된 파일 형식',
        description: '이미지 파일만 업로드할 수 있습니다.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // 파일을 이미지로 표시
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);

      // QR 코드 스캔
      const result = await QrScannerLib.scanImage(file);
      handleQrResult(result);
      
      toast({
        title: '이미지 업로드 성공',
        description: 'QR 코드를 스캔했습니다.'
      });
    } catch (error) {
      console.error('QR 스캔 실패:', error);
      toast({
        title: 'QR 코드를 찾을 수 없음',
        description: '업로드한 이미지에서 QR 코드를 찾을 수 없습니다.',
        variant: 'destructive'
      });
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const clearUploadedImage = () => {
    setUploadedImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetScanner = () => {
    setLastResult('');
    setScanCount(0);
    clearUploadedImage();
    toast({
      title: '리셋 완료',
      description: '스캐너가 초기화되었습니다.'
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card className="shadow-elegant">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
            QR 코드 스캐너
          </CardTitle>
          <CardDescription>
            카메라로 실시간 스캔하거나 QR 코드 이미지를 업로드하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="camera" disabled={cameras.length === 0}>
                <Camera className="w-4 h-4 mr-2" />
                카메라 스캔
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="w-4 h-4 mr-2" />
                이미지 업로드
              </TabsTrigger>
            </TabsList>

            {/* 카메라 스캔 탭 */}
            <TabsContent value="camera" className="space-y-6">
              {/* 카메라 선택 */}
              {cameras.length > 1 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">카메라 선택</label>
                  <Select value={selectedCamera} onValueChange={changeCamera}>
                    <SelectTrigger>
                      <SelectValue placeholder="카메라를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {cameras.map((camera) => (
                        <SelectItem key={camera.id} value={camera.id}>
                          {camera.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 비디오 화면 */}
              <div className="relative bg-muted rounded-lg overflow-hidden aspect-square">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />
                {!isScanning && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <CameraOff className="w-16 h-16 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">카메라가 비활성화됨</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 카메라 컨트롤 버튼 */}
              <div className="flex gap-3 justify-center">
                {!isScanning ? (
                  <Button onClick={startScanning} variant="glow" size="lg">
                    <Camera className="w-4 h-4" />
                    스캔 시작
                  </Button>
                ) : (
                  <Button onClick={stopScanning} variant="outline" size="lg">
                    <CameraOff className="w-4 h-4" />
                    스캔 중지
                  </Button>
                )}
              </div>
            </TabsContent>

            {/* 이미지 업로드 탭 */}
            <TabsContent value="upload" className="space-y-6">
              {/* 파일 업로드 영역 */}
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                {!uploadedImage ? (
                  <div 
                    onClick={triggerFileUpload}
                    className="relative bg-muted rounded-lg overflow-hidden aspect-square border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer group"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <FileImage className="w-16 h-16 mx-auto text-muted-foreground group-hover:text-primary transition-colors" />
                        <div>
                          <p className="text-muted-foreground group-hover:text-foreground transition-colors">
                            클릭하여 QR 코드 이미지 업로드
                          </p>
                          <p className="text-sm text-muted-foreground/70">
                            JPG, PNG, GIF 등 지원
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative bg-muted rounded-lg overflow-hidden aspect-square">
                    <img
                      src={uploadedImage}
                      alt="업로드된 QR 코드"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>

              {/* 업로드 컨트롤 버튼 */}
              <div className="flex gap-3 justify-center">
                <Button onClick={triggerFileUpload} variant="glow" size="lg">
                  <Upload className="w-4 h-4" />
                  {uploadedImage ? '다른 이미지 선택' : '이미지 선택'}
                </Button>
                {uploadedImage && (
                  <Button onClick={clearUploadedImage} variant="outline" size="lg">
                    <RefreshCw className="w-4 h-4" />
                    이미지 삭제
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* 공통 리셋 버튼 */}
          <div className="flex justify-center">
            <Button onClick={resetScanner} variant="secondary" size="lg">
              <RefreshCw className="w-4 h-4" />
              전체 리셋
            </Button>
          </div>

          {/* 스캔 정보 */}
          <div className="text-center space-y-2 p-4 bg-accent/30 rounded-lg">
            <div className="text-sm text-muted-foreground">
              스캔된 QR 코드 수: <span className="font-semibold text-foreground">{scanCount}</span>
            </div>
            {lastResult && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">마지막 스캔 결과:</div>
                <div className="flex items-center gap-2 justify-center p-2 bg-background rounded border">
                  <ExternalLink className="w-4 h-4 text-primary" />
                  <span className="text-sm font-mono break-all">{lastResult}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}