export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'ejecutivo' | 'operador';
  activo: boolean;
  created_at: Date;
}

export interface Cliente {
  id: number;
  id_cliente: string;
  nombre_cliente: string;
  rut_cliente?: string;
  segmento?: string;
  servicio?: string;
  plan?: string;
  cantidad_empleados?: number;
  pais: string;
  region?: string;
  es_activo: boolean;
  fecha_creacion?: Date;
  ultima_conexion?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Contacto {
  id: number;
  cliente_id: number;
  nombre?: string;
  email?: string;
  telefono?: string;
  rol?: string;
  es_principal: boolean;
  created_at: Date;
}

export interface Renovacion {
  id: number;
  cliente_id: number;
  id_renovacion?: string;
  fecha_vencimiento: Date;
  fecha_creacion: Date;
  ciclo?: string;
  monto_uf?: number;
  mrr_uf?: number;
  ejecutivo_id: number;
  estado: 'por_contactar' | 'contactado' | 'en_negociacion' | 'ganado' | 'perdido' | 'renovado';
  semaforo: 'verde' | 'amarillo' | 'rojo' | 'indeterminado';
  riesgo_churn_score: number;
  estado_operacion?: string;
  tipo_pago?: string;
  tarjeta_suscrita: boolean;
  requiere_follow_up: boolean;
  escalado_a_gerencia: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Seguimiento {
  id: number;
  renovacion_id: number;
  tipo?: string;
  contenido?: string;
  usuario_id?: number;
  fecha: Date;
  leido_por_cliente?: boolean;
  respuesta_obtenida: boolean;
  dias_sin_respuesta: number;
  sentimiento_cliente?: string;
  created_at: Date;
}

export interface DraftIA {
  id: number;
  renovacion_id: number;
  tipo_email: string;
  asunto_propuesto: string;
  contenido_propuesto: string;
  aprobado_por?: number;
  aprobado_en?: Date;
  enviado_en?: Date;
  feedback_usuario?: string;
  version: number;
  created_at: Date;
}

export interface Alerta {
  id: number;
  renovacion_id: number;
  tipo: string;
  mensaje: string;
  activa: boolean;
  resuelta: boolean;
  fecha_resolucion?: Date;
  created_at: Date;
}

export interface AuthSession {
  user: {
    id: number;
    email: string;
    nombre: string;
    rol: string;
  };
  expires: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
