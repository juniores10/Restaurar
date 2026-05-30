import { useState, useEffect, useRef } from 'react';
import { FileText, Calendar, Download, CheckCircle, XCircle, Eye, FileSpreadsheet, DollarSign, PenTool, RefreshCw, Camera, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PDFDocument } from 'pdf-lib';
import * as faceapi from 'face-api.js';
import { calculateFileHash } from '../utils/documentIntegrity';

interface PayrollAssignment {
  id: string;
  document_id: string;
  viewed_at: string | null;
  signed_at: string | null;
  signature_data: string | null;
  signed_file_url: string | null;
  payroll_documents: {
    id: string;
    document_type: 'payslip' | 'timesheet';
    reference_month: string;
    title: string;
    description: string | null;
    file_url: string;
  };
}

export function EmployeePayroll() {
  const { employeeProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'payslip' | 'timesheet'>('payslip');
  const [assignments, setAssignments] = useState<PayrollAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<PayrollAssignment | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selfieData, setSelfieData] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [faceDetectionResult, setFaceDetectionResult] = useState<{
    detected: boolean;
    count: number;
    confidence: number;
    error: string | null;
  } | null>(null);
  const [isDetectingFace, setIsDetectingFace] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    loadFaceDetectionModels();
  }, []);

  useEffect(() => {
    if (employeeProfile?.id) {
      loadAssignments();
    } else {
      setIsLoading(false);
    }
  }, [employeeProfile, activeTab]);

  useEffect(() => {
    if (cameraStream && videoRef.current && showCamera) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(error => {
          console.error('Erro ao iniciar video:', error);
        });
      };
    }
  }, [cameraStream, showCamera]);

  const loadAssignments = async () => {
    if (!employeeProfile?.id) {
      console.log('EmployeePayroll: Sem employee profile');
      return;
    }

    console.log('EmployeePayroll: Carregando documentos para:', employeeProfile.id, 'Tipo:', activeTab);
    setIsLoading(true);
    setError(null);
    try {
      const { data: allData, error } = await supabase
        .from('payroll_document_assignments')
        .select(`
          *,
          payroll_documents!inner(*)
        `)
        .eq('employee_id', employeeProfile.id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('EmployeePayroll: Dados recebidos:', allData?.length || 0, 'documentos');
      console.log('EmployeePayroll: Dados completos:', JSON.stringify(allData, null, 2));

      const filtered = (allData || []).filter(
        (assignment: any) => assignment.payroll_documents?.document_type === activeTab
      );

      console.log('EmployeePayroll: Após filtro por tipo', activeTab, ':', filtered.length, 'documentos');

      filtered.sort((a: any, b: any) => {
        const dateA = new Date(a.payroll_documents?.reference_month || 0);
        const dateB = new Date(b.payroll_documents?.reference_month || 0);
        return dateB.getTime() - dateA.getTime();
      });

      setAssignments(filtered);
      console.log('EmployeePayroll: Documentos definidos:', filtered);
    } catch (error: any) {
      console.error('Erro ao carregar documentos:', error);
      setError(error?.message || 'Erro ao carregar documentos');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsViewed = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('payroll_document_assignments')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', assignmentId)
        .is('viewed_at', null);

      if (error) throw error;
      loadAssignments();
    } catch (error) {
      console.error('Erro ao marcar como visualizado:', error);
    }
  };

  const getFileUrl = (assignment: PayrollAssignment): string => {
    return assignment.signed_file_url || assignment.payroll_documents.file_url;
  };

  const handleView = async (assignment: PayrollAssignment) => {
    try {
      const fileUrl = getFileUrl(assignment);
      const { data, error } = await supabase.storage
        .from('payroll-documents')
        .download(fileUrl);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      window.open(url, '_blank');

      if (!assignment.viewed_at) {
        await markAsViewed(assignment.id);
      }
    } catch (error) {
      console.error('Erro ao visualizar documento:', error);
      alert('Erro ao visualizar documento');
    }
  };

  const handleDownload = async (assignment: PayrollAssignment) => {
    try {
      const fileUrl = getFileUrl(assignment);
      const { data, error } = await supabase.storage
        .from('payroll-documents')
        .download(fileUrl);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      const fileName = assignment.signed_at
        ? `${assignment.payroll_documents.title} - Assinado.pdf`
        : `${assignment.payroll_documents.title}.pdf`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (!assignment.viewed_at) {
        await markAsViewed(assignment.id);
      }
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      alert('Erro ao baixar documento');
    }
  };

  const openSignatureModal = async (assignment: PayrollAssignment) => {
    setSelectedAssignment(assignment);
    setShowSignatureModal(true);
    setSelfieData(null);
    setLocation(null);
    setFaceDetectionResult(null);
    setHasSignature(false);

    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    }, 100);

    const ip = await getIPAddress();
    setIpAddress(ip);

    try {
      const loc = await requestLocation();
      setLocation(loc);
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      alert('Não foi possível obter sua localização. A assinatura continuará sem dados de localização.');
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const isCanvasEmpty = (canvas: HTMLCanvasElement): boolean => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return true;

    const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    for (let i = 0; i < pixelData.length; i += 4) {
      if (pixelData[i + 3] !== 0) {
        return false;
      }
    }

    return true;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const loadFaceDetectionModels = async () => {
    try {
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      console.log('Modelos de detecção facial carregados');
    } catch (error) {
      console.error('Erro ao carregar modelos de detecção facial:', error);
    }
  };

  const detectFaceInImage = async (imageDataUrl: string): Promise<{
    detected: boolean;
    count: number;
    confidence: number;
    error: string | null;
  }> => {
    try {
      if (!modelsLoaded) {
        return {
          detected: false,
          count: 0,
          confidence: 0,
          error: 'Modelos de detecção facial não carregados'
        };
      }

      const img = await faceapi.fetchImage(imageDataUrl);
      const detections = await faceapi
        .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      if (detections.length === 0) {
        return {
          detected: false,
          count: 0,
          confidence: 0,
          error: null
        };
      }

      const avgConfidence = detections.reduce((sum, d) => sum + d.detection.score, 0) / detections.length;

      return {
        detected: true,
        count: detections.length,
        confidence: avgConfidence,
        error: null
      };
    } catch (error: any) {
      console.error('Erro na detecção facial:', error);
      return {
        detected: false,
        count: 0,
        confidence: 0,
        error: error.message || 'Erro desconhecido'
      };
    }
  };

  const getIPAddress = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Erro ao obter IP:', error);
      return 'Não disponível';
    }
  };

  const requestLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não suportada'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        }
      );
    });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setCameraStream(stream);
      setShowCamera(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(error => {
            console.error('Erro ao iniciar video:', error);
          });
        };
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      alert('Erro ao acessar a câmera. Por favor, permita o acesso à câmera.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const captureSelfie = async () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const selfieDataUrl = canvas.toDataURL('image/jpeg', 0.8);

    setIsDetectingFace(true);
    const faceResult = await detectFaceInImage(selfieDataUrl);
    setIsDetectingFace(false);

    if (!faceResult.detected) {
      alert('Nenhum rosto foi detectado na foto. Por favor, tire uma nova selfie garantindo que seu rosto esteja visível e bem iluminado.');
      return;
    }

    if (faceResult.count > 1) {
      alert(`${faceResult.count} rostos foram detectados. Por favor, tire uma nova selfie apenas com você na foto.`);
      return;
    }

    if (faceResult.confidence < 0.5) {
      alert('A qualidade da detecção facial está baixa. Por favor, tire uma nova selfie com melhor iluminação e enquadramento.');
      return;
    }

    setFaceDetectionResult(faceResult);
    setSelfieData(selfieDataUrl);
    stopCamera();
  };

  const addSignatureToPDF = async (pdfBytes: ArrayBuffer, signatureDataUrl: string, employeeName: string): Promise<Uint8Array> => {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    const signatureImageBytes = await fetch(signatureDataUrl).then(res => res.arrayBuffer());
    const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

    const signatureWidth = 120;
    const signatureHeight = (signatureImage.height / signatureImage.width) * signatureWidth;

    const lastPage = pages[pages.length - 1];
    const { width, height } = lastPage.getSize();

    const x = width / 2 - signatureWidth / 2;
    const y = 80;

    lastPage.drawImage(signatureImage, {
      x,
      y,
      width: signatureWidth,
      height: signatureHeight,
    });

    lastPage.drawText(`Assinado digitalmente por: ${employeeName}`, {
      x: x,
      y: y - 15,
      size: 8,
    });

    lastPage.drawText(`Data: ${new Date().toLocaleString('pt-BR')}`, {
      x: x,
      y: y - 28,
      size: 8,
    });

    return await pdfDoc.save();
  };

  const saveSignature = async () => {
    if (!selectedAssignment || !employeeProfile) return;

    if (!selfieData) {
      alert('Por favor, tire uma selfie para continuar com a assinatura.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isCanvasEmpty(canvas)) {
      alert('Por favor, desenhe sua assinatura no campo acima antes de confirmar.');
      return;
    }

    const signatureData = canvas.toDataURL('image/png');

    setIsSigning(true);
    try {
      let selfieUrl = '';

      if (selfieData) {
        const selfieBlob = await fetch(selfieData).then(r => r.blob());
        const timestamp = Date.now();
        const selfiePath = `${employeeProfile.id}/signature_${timestamp}.jpg`;

        const { error: selfieUploadError } = await supabase.storage
          .from('signature-selfies')
          .upload(selfiePath, selfieBlob, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (selfieUploadError) throw selfieUploadError;
        selfieUrl = selfiePath;
      }

      const { data: originalPdfBlob, error: downloadError } = await supabase.storage
        .from('payroll-documents')
        .download(selectedAssignment.payroll_documents.file_url);

      if (downloadError) throw downloadError;

      const originalPdfBytes = await originalPdfBlob.arrayBuffer();

      // Calculate hash of original document (before signature)
      const documentHashBefore = await calculateFileHash(originalPdfBlob);

      const signedPdfBytes = await addSignatureToPDF(
        originalPdfBytes,
        signatureData,
        employeeProfile.name
      );

      // Calculate hash of signed document (after signature)
      const signedPdfBlob = new Blob([signedPdfBytes], { type: 'application/pdf' });
      const documentHashAfter = await calculateFileHash(signedPdfBlob);

      const timestamp = Date.now();
      const originalPath = selectedAssignment.payroll_documents.file_url;
      const pathParts = originalPath.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
      const signedFilePath = `${pathParts[0]}/signed/${fileNameWithoutExt}_${employeeProfile.id}_${timestamp}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('payroll-documents')
        .upload(signedFilePath, signedPdfBytes, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('payroll_document_assignments')
        .update({
          signed_at: new Date().toISOString(),
          signature_data: signatureData,
          signed_file_url: signedFilePath,
          viewed_at: selectedAssignment.viewed_at || new Date().toISOString()
        })
        .eq('id', selectedAssignment.id);

      if (updateError) throw updateError;

      // Create timestamp authority (TSA)
      const timestampAuthority = new Date().toISOString();

      const { error: signatureRecordError } = await supabase
        .from('payroll_signatures')
        .insert({
          payroll_assignment_id: selectedAssignment.id,
          employee_id: employeeProfile.id,
          selfie_url: selfieUrl,
          latitude: location?.latitude,
          longitude: location?.longitude,
          ip_address: ipAddress,
          user_agent: navigator.userAgent,
          signed_at: new Date().toISOString(),
          face_detected: faceDetectionResult?.detected || false,
          faces_count: faceDetectionResult?.count || 0,
          face_confidence: faceDetectionResult?.confidence || 0,
          face_detection_error: faceDetectionResult?.error,
          document_hash_before: documentHashBefore,
          document_hash_after: documentHashAfter,
          timestamp_authority: timestampAuthority,
          is_locked: true,
          version_number: 1
        });

      if (signatureRecordError) throw signatureRecordError;

      setShowSignatureModal(false);
      setSelectedAssignment(null);
      setSelfieData(null);
      setFaceDetectionResult(null);
      loadAssignments();
    } catch (error) {
      console.error('Erro ao salvar assinatura:', error);
      alert('Erro ao salvar assinatura. Por favor, tente novamente.');
    } finally {
      setIsSigning(false);
    }
  };

  const getStatusBadge = (assignment: PayrollAssignment) => {
    if (assignment.signed_at) {
      return (
        <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          Assinado
        </div>
      );
    }
    if (assignment.viewed_at) {
      return (
        <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          <Eye className="w-4 h-4" />
          Visualizado
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
        <XCircle className="w-4 h-4" />
        Pendente
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 pb-20 md:pb-8">
      <div className="mb-6 md:mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Meus Documentos</h1>
          <p className="text-sm md:text-base text-gray-600">Visualize e assine seus holerites e espelhos de ponto</p>
        </div>
        <button
          onClick={() => loadAssignments()}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Atualizar lista"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md mb-6">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('payslip')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-4 font-medium transition-colors text-sm md:text-base ${
                activeTab === 'payslip'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
              Holerites
            </button>
            <button
              onClick={() => setActiveTab('timesheet')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-4 font-medium transition-colors text-sm md:text-base ${
                activeTab === 'timesheet'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden xs:inline">Espelhos de </span>Ponto
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <p className="text-red-800 font-medium">Erro ao carregar documentos</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button
            onClick={() => loadAssignments()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Carregando...</p>
        </div>
      ) : !error && assignments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Nenhum documento encontrado</p>
          <p className="text-gray-400 mt-2">
            Você ainda não tem {activeTab === 'payslip' ? 'holerites' : 'espelhos de ponto'} disponíveis
          </p>
        </div>
      ) : !error && (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const doc = assignment.payroll_documents;
            if (!doc) return null;

            return (
              <div key={assignment.id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {activeTab === 'payslip' ? (
                        <DollarSign className="w-6 h-6 text-blue-600" />
                      ) : (
                        <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                      )}
                      <h3 className="text-lg font-semibold text-gray-800">
                        {doc.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(doc.reference_month + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </div>
                      {getStatusBadge(assignment)}
                    </div>
                    {doc.description && (
                      <p className="text-sm text-gray-500">{doc.description}</p>
                    )}
                    {assignment.signed_at && (
                      <div className="mt-2 text-sm text-gray-500">
                        Assinado em: {new Date(assignment.signed_at).toLocaleString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleView(assignment)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Visualizar
                  </button>
                  <button
                    onClick={() => handleDownload(assignment)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Baixar
                  </button>
                  {!assignment.signed_at && (
                    <button
                      onClick={() => openSignatureModal(assignment)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      <PenTool className="w-4 h-4" />
                      Assinar Documento
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showSignatureModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full my-8 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-800">Assinar Documento</h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedAssignment.payroll_documents.title}
              </p>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1. Tire uma selfie para verificação:
                </label>
                {!selfieData ? (
                  <div className="space-y-3">
                    {!showCamera ? (
                      <button
                        onClick={startCamera}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Camera className="w-5 h-5" />
                        Abrir Câmera
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-black">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full"
                            style={{ maxHeight: '400px', minHeight: '300px' }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={captureSelfie}
                            disabled={isDetectingFace}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Camera className="w-4 h-4" />
                            Capturar Foto
                          </button>
                          <button
                            onClick={stopCamera}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="border-2 border-green-300 rounded-lg overflow-hidden">
                      <img src={selfieData} alt="Selfie" className="w-full" />
                    </div>
                    <button
                      onClick={() => {
                        setSelfieData(null);
                        setFaceDetectionResult(null);
                      }}
                      className="text-sm text-gray-600 hover:text-gray-800 underline"
                    >
                      Tirar nova foto
                    </button>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        Selfie capturada com sucesso
                      </div>
                      {faceDetectionResult && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                          <div className="flex items-start gap-2 text-green-800">
                            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium">Validação Facial Aprovada</p>
                              <p className="text-xs text-green-600 mt-1">
                                {faceDetectionResult.count} rosto detectado • Confiança: {(faceDetectionResult.confidence * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {isDetectingFace && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 mt-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Detectando rosto na foto...</span>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  2. Desenhe sua assinatura abaixo com o dedo ou mouse:
                </label>
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={300}
                    className="w-full touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{ touchAction: 'none' }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <PenTool className="w-4 h-4" />
                <p>Assine dentro do quadro branco acima</p>
              </div>

              <button
                onClick={clearSignature}
                className="text-sm text-gray-600 hover:text-gray-800 underline mb-4"
              >
                Limpar assinatura
              </button>

              {location && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  <p className="font-medium">Dados de localização capturados</p>
                  <p className="text-xs mt-1">Lat: {location.latitude.toFixed(6)}, Long: {location.longitude.toFixed(6)}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0 bg-white">
              <button
                onClick={() => {
                  stopCamera();
                  setShowSignatureModal(false);
                  setSelectedAssignment(null);
                  setSelfieData(null);
                  setFaceDetectionResult(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isSigning}
              >
                Cancelar
              </button>
              <button
                onClick={saveSignature}
                disabled={isSigning || !selfieData || !hasSignature}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigning ? 'Salvando...' : 'Confirmar Assinatura'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
