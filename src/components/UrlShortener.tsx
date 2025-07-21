import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Download, Link, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

interface ShortLinkResult {
  short_url: string;
  short_code: string;
  original_url: string;
  existing?: boolean;
}

const UrlShortener = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ShortLinkResult | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const shortenUrl = async () => {
    if (!url.trim()) {
      toast({
        title: '오류',
        description: 'URL을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (!isValidUrl(url)) {
      toast({
        title: '오류',
        description: '올바른 URL을 입력해주세요. (http:// 또는 https://로 시작)',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-short-url', {
        body: { original_url: url }
      });

      if (error) throw error;

      setResult(data);
      
      // Generate QR code
      const qrData = await QRCode.toDataURL(data.short_url, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrDataUrl(qrData);

      toast({
        title: '성공!',
        description: data.existing ? '기존 단축 URL을 찾았습니다.' : '새로운 단축 URL이 생성되었습니다.',
      });
    } catch (error) {
      console.error('Error shortening URL:', error);
      toast({
        title: '오류',
        description: '단축 URL 생성에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: '복사 완료',
        description: '클립보드에 복사되었습니다.',
      });
    } catch (error) {
      toast({
        title: '복사 실패',
        description: '클립보드 복사에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `qr-${result?.short_code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setUrl('');
    setResult(null);
    setQrDataUrl(null);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          URL 단축기 + QR 생성기
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="단축할 URL을 입력하세요 (예: https://example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && shortenUrl()}
            className="flex-1"
          />
          <Button 
            onClick={shortenUrl} 
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? '생성 중...' : '단축하기'}
          </Button>
        </div>

        {result && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <label className="text-sm font-medium">원본 URL:</label>
              <div className="flex gap-2">
                <Input value={result.original_url} readOnly className="flex-1" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(result.original_url)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">단축 URL:</label>
              <div className="flex gap-2">
                <Input value={result.short_url} readOnly className="flex-1" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(result.short_url)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {qrDataUrl && (
              <div className="space-y-2 text-center">
                <label className="text-sm font-medium flex items-center justify-center gap-2">
                  <QrCode className="h-4 w-4" />
                  QR 코드
                </label>
                <div className="flex flex-col items-center gap-2">
                  <img src={qrDataUrl} alt="QR Code" className="border rounded" />
                  <Button
                    variant="outline"
                    onClick={downloadQR}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    QR 다운로드
                  </Button>
                </div>
              </div>
            )}

            <Button onClick={reset} variant="outline" className="w-full">
              새로 만들기
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UrlShortener;