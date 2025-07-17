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
  const [isDragging, setIsDragging] = useState(false);
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

  // 전역 클립보드 붙여넣기 이벤트 리스너
  useEffect(() => {
    const handleGlobalPaste = (e: KeyboardEvent) => {
      // Ctrl+V 또는 Cmd+V가 눌렸을 때
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        // 현재 업로드 탭에 있을 때만 처리
        if (activeTab === 'upload') {
          // 클립보드 데이터를 직접 읽기
          navigator.clipboard.read().then(items => {
            for (const item of items) {
              for (const type of item.types) {
                if (type.startsWith('image/')) {
                  item.getType(type).then(blob => {
                    const file = new File([blob], 'clipboard-image', { type });
                    processImageFile(file);
                    toast({
                      title: '클립보드에서 이미지 붙여넣기',
                      description: '이미지가 성공적으로 붙여넣어졌습니다.'
                    });
                  });
                  return;
                }
              }
            }
            toast({
              title: '클립보드에 이미지가 없습니다',
              description: '이미지를 복사한 후 다시 시도해주세요.',
              variant: 'destructive'
            });
          }).catch(() => {
            toast({
              title: '클립보드 접근 실패',
              description: '클립보드에 접근할 수 없습니다.',
              variant: 'destructive'
            });
          });
        }
      }
    };

    document.addEventListener('keydown', handleGlobalPaste);
    return () => {
      document.removeEventListener('keydown', handleGlobalPaste);
    };
  }, [activeTab]);

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

  // 공통 이미지 처리 함수
  const processImageFile = async (file: File) => {
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
        title: '이미지 처리 성공',
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

  // 파일 업로드 처리
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processImageFile(file);
  };

  // 드래그 앤 드롭 처리
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (!imageFile) {
      toast({
        title: '이미지 파일이 없습니다',
        description: '이미지 파일을 드래그해주세요.',
        variant: 'destructive'
      });
      return;
    }

    await processImageFile(imageFile);
  };

  // 클립보드 붙여넣기 처리
  const handlePaste = async (e: React.ClipboardEvent) => {
    e.preventDefault();
    
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(item => item.type.startsWith('image/'));

    if (!imageItem) {
      toast({
        title: '클립보드에 이미지가 없습니다',
        description: '이미지를 복사한 후 붙여넣어주세요.',
        variant: 'destructive'
      });
      return;
    }

    const file = imageItem.getAsFile();
    if (file) {
      await processImageFile(file);
      toast({
        title: '클립보드에서 이미지 붙여넣기',
        description: '이미지가 성공적으로 붙여넣어졌습니다.'
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
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onPaste={handlePaste}
                    tabIndex={0}
                    className={`relative bg-muted rounded-lg overflow-hidden aspect-square border-2 border-dashed transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      isDragging 
                        ? 'border-primary bg-primary/5 scale-105' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center space-y-4">
                        {isDragging ? (
                          <>
                            <Upload className="w-16 h-16 mx-auto text-primary animate-bounce" />
                            <div>
                              <p className="text-primary font-medium">
                                이미지를 여기에 놓아주세요
                              </p>
                              <p className="text-sm text-primary/70">
                                QR 코드 이미지를 드롭하세요
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <FileImage className="w-16 h-16 mx-auto text-muted-foreground group-hover:text-primary transition-colors" />
                            <div>
                              <p className="text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                                QR 코드 이미지를 업로드하세요
                              </p>
                              <div className="text-sm text-muted-foreground/70 space-y-1">
                                <p>• 클릭하여 파일 선택</p>
                                <p>• 드래그 앤 드롭</p>
                                <p>• Ctrl+V로 붙여넣기</p>
                                <p className="text-xs">(JPG, PNG, GIF 등 지원)</p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="relative bg-muted rounded-lg overflow-hidden aspect-square group cursor-pointer"
                    onClick={triggerFileUpload}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onPaste={handlePaste}
                    tabIndex={0}
                  >
                    <img
                      src={uploadedImage}
                      alt="업로드된 QR 코드"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-center text-white">
                        <Upload className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">다른 이미지로 변경</p>
                      </div>
                    </div>
                    {isDragging && (
                      <div className="absolute inset-0 bg-primary/20 border-2 border-primary border-dashed flex items-center justify-center">
                        <div className="text-center text-primary">
                          <Upload className="w-8 h-8 mx-auto mb-2 animate-bounce" />
                          <p className="text-sm font-medium">새 이미지로 교체</p>
                        </div>
                      </div>
                    )}
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