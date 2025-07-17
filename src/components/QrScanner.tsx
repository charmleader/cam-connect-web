import { useEffect, useRef, useState } from 'react';
import QrScannerLib from 'qr-scanner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CameraOff, ExternalLink, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Camera {
  id: string;
  label: string;
}

export default function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScannerLib | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');
  const [scanCount, setScanCount] = useState(0);
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
        }
      } catch (error) {
        console.error('카메라 목록을 가져오는데 실패했습니다:', error);
        toast({
          title: '카메라 오류',
          description: '카메라에 접근할 수 없습니다. 권한을 확인해주세요.',
          variant: 'destructive'
        });
      }
    };

    getCameras();
  }, [toast]);

  // QR 스캐너 초기화
  useEffect(() => {
    if (!videoRef.current || !selectedCamera) return;

    const video = videoRef.current;
    
    const qrScanner = new QrScannerLib(
      video,
      (result) => {
        // 동일한 QR 코드 연속 스캔 방지
        if (result.data !== lastResult) {
          setLastResult(result.data);
          setScanCount(prev => prev + 1);
          
          toast({
            title: 'QR 코드 감지!',
            description: `URL: ${result.data}`,
          });

          // URL 유효성 검사
          try {
            const url = new URL(result.data);
            if (url.protocol === 'http:' || url.protocol === 'https:') {
              // 새 탭에서 URL 열기
              window.open(result.data, '_blank', 'noopener,noreferrer');
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
  }, [selectedCamera, lastResult, toast]);

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

  const resetScanner = () => {
    setLastResult('');
    setScanCount(0);
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
            QR 코드를 스캔하여 웹사이트에 바로 접속하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

          {/* 컨트롤 버튼 */}
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
            <Button onClick={resetScanner} variant="secondary" size="lg">
              <RefreshCw className="w-4 h-4" />
              리셋
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