import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, AlertCircle } from 'lucide-react';

const ShortUrlRedirect = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [urlData, setUrlData] = useState<{ original_url: string; click_count: number } | null>(null);

  useEffect(() => {
    const redirectToUrl = async () => {
      if (!shortCode) {
        setError('잘못된 단축 코드입니다.');
        setLoading(false);
        return;
      }

      try {
        // Find the original URL
        const { data: linkData, error } = await supabase
          .from('short_links')
          .select('original_url, click_count')
          .eq('short_code', shortCode)
          .single();

        if (error || !linkData) {
          setError('단축 URL을 찾을 수 없습니다.');
          setLoading(false);
          return;
        }

        setUrlData(linkData);

        // Update click count
        await supabase
          .from('short_links')
          .update({ click_count: linkData.click_count + 1 })
          .eq('short_code', shortCode);

        // Redirect after a short delay to show the loading screen
        setTimeout(() => {
          window.location.href = linkData.original_url;
        }, 2000);

      } catch (err) {
        console.error('Redirect error:', err);
        setError('리다이렉션 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    redirectToUrl();
  }, [shortCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">리다이렉션 중...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">잠시만 기다려주세요. 곧 원본 페이지로 이동됩니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              오류 발생
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.href = '/'} className="w-full">
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">리다이렉션 준비 완료</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">다음 URL로 이동합니다:</p>
          <div className="bg-muted p-3 rounded text-sm break-all">
            {urlData?.original_url}
          </div>
          <p className="text-xs text-muted-foreground">
            방문 횟수: {urlData?.click_count || 0}회
          </p>
          <div className="space-y-2">
            <Button 
              onClick={() => window.location.href = urlData?.original_url || '/'}
              className="w-full flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              지금 이동하기
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              홈으로 돌아가기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShortUrlRedirect;