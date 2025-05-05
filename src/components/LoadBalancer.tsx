"use client"
import React, { useState, useEffect } from 'react';
import { CircleCheck, Server as ServerIcon, Share2, Clock, Eye, Activity, Lock } from 'lucide-react';

// Patrón Singleton para el LoadBalancer
class LoadBalancerSingleton {
  static instance = null;
  
  constructor() {
    this.servers = [];
    this.observers = [];
    this.currentServerIndex = 0;
  }
  
  static getInstance() {
    if (!LoadBalancerSingleton.instance) {
      LoadBalancerSingleton.instance = new LoadBalancerSingleton();
    }
    return LoadBalancerSingleton.instance;
  }
  
  addServer(server) {
    this.servers.push(server);
    return this;
  }
  
  // Patrón Observer
  addObserver(observer) {
    this.observers.push(observer);
    return this;
  }
  
  notifyObservers(request, server) {
    this.observers.forEach(observer => observer.update(request, server));
  }
  
  // Algoritmo Round Robin
  getNextServer() {
    if (this.servers.length === 0) return null;
    
    const server = this.servers[this.currentServerIndex];
    this.currentServerIndex = (this.currentServerIndex + 1) % this.servers.length;
    return server;
  }
  
  // Procesar solicitud a través de la cadena de responsabilidad
  processRequest(request) {
    const server = this.getNextServer();
    if (!server) return { success: false, message: "No hay servidores disponibles" };
    
    // Notificar a los observadores sobre la distribución
    this.notifyObservers(request, server);
    
    return server.handleRequest(request);
  }
}

// Interfaz para los handlers de la cadena de responsabilidad
class RequestHandler {
  constructor() {
    this.nextHandler = null;
  }
  
  setNext(handler) {
    this.nextHandler = handler;
    return handler;
  }
  
  handle(request) {
    if (this.nextHandler) {
      return this.nextHandler.handle(request);
    }
    return request;
  }
}

// Handlers concretos para la cadena de responsabilidad
class AuthenticationHandler extends RequestHandler {
  handle(request) {
    console.log("Autenticando solicitud:", request.id);
    // Lógica de autenticación
    request.authenticated = true;
    return super.handle(request);
  }
}

class LoggingHandler extends RequestHandler {
  handle(request) {
    console.log("Registrando solicitud:", request.id, "timestamp:", new Date().toISOString());
    request.logged = true;
    return super.handle(request);
  }
}

class ValidationHandler extends RequestHandler {
  handle(request) {
    console.log("Validando solicitud:", request.id);
    request.validated = true;
    return super.handle(request);
  }
}

// Clase servidor que implementa la cadena de responsabilidad
class Server {
  constructor(id, handler) {
    this.id = id;
    this.handler = handler;
    this.requests = [];
    this.status = "online";
  }
  
  handleRequest(request) {
    // Procesar la solicitud a través de la cadena de responsabilidad
    const processedRequest = this.handler.handle({...request});
    this.requests.push(processedRequest);
    
    return {
      success: true,
      server: this.id,
      request: processedRequest
    };
  }
}

// Observadores concretos
class RequestObserver {
  update(request, server) {
    console.log(`Solicitud ${request.id} asignada al servidor ${server.id}`);
  }
}

class MetricsObserver {
  constructor() {
    this.metrics = {};
  }
  
  update(request, server) {
    if (!this.metrics[server.id]) {
      this.metrics[server.id] = 0;
    }
    this.metrics[server.id]++;
    console.log(`Métricas actualizadas para el servidor ${server.id}: ${this.metrics[server.id]} solicitudes`);
  }
  
  getMetrics() {
    return this.metrics;
  }
}

// Componente React para visualizar el sistema
const LoadBalancerSystem = () => {
  const [loadBalancer, setLoadBalancer] = useState(null);
  const [servers, setServers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [processedRequests, setProcessedRequests] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [requestTypes] = useState(['GET', 'POST', 'PUT', 'DELETE']);
  const [requestPaths] = useState(['/users', '/products', '/orders', '/auth']);

  // Inicialización del sistema
  useEffect(() => {
    // Crear la cadena de responsabilidad
    const authHandler = new AuthenticationHandler();
    const loggingHandler = new LoggingHandler();
    const validationHandler = new ValidationHandler();
    
    authHandler.setNext(loggingHandler).setNext(validationHandler);
    
    // Crear servidores
    const serverList = [];
    for (let i = 1; i <= 4; i++) {
      serverList.push(new Server(`Server-${i}`, authHandler));
    }
    
    // Inicializar el balanceador de carga (Singleton)
    const balancer = LoadBalancerSingleton.getInstance();
    serverList.forEach(server => balancer.addServer(server));
    
    // Agregar observadores
    const requestObserver = new RequestObserver();
    const metricsObserver = new MetricsObserver();
    balancer.addObserver(requestObserver).addObserver(metricsObserver);
    
    setLoadBalancer(balancer);
    setServers(serverList);
    
    // Actualizar métricas cada segundo
    const intervalId = setInterval(() => {
      setMetrics({...metricsObserver.getMetrics()});
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Generar una nueva solicitud
  const generateRequest = () => {
    if (!loadBalancer) return;
    
    const requestId = Math.floor(Math.random() * 10000);
    const requestType = requestTypes[Math.floor(Math.random() * requestTypes.length)];
    const requestPath = requestPaths[Math.floor(Math.random() * requestPaths.length)];
    
    const newRequest = {
      id: requestId,
      type: requestType,
      path: requestPath,
      timestamp: new Date().toISOString()
    };
    
    setRequests(prev => [...prev, newRequest]);
    
    // Procesar la solicitud con el balanceador de carga
    const result = loadBalancer.processRequest(newRequest);
    
    if (result.success) {
      setProcessedRequests(prev => [...prev, {
        ...result,
        timestamp: new Date().toISOString()
      }]);
    }
  };

  return (
    <div className="flex flex-col p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">Sistema de Load Balancer</h1>
      
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1 bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2 flex items-center">
            <Activity className="mr-2" size={20} />
            Patrones Implementados
          </h2>
          <ul className="space-y-2">
            <li className="flex items-center">
              <CircleCheck className="text-green-500 mr-2" size={16} />
              <span className="font-medium">Singleton:</span>
                              <span className="ml-1 text-gray-800">Instancia única del Load Balancer</span>
            </li>
            <li className="flex items-center">
              <CircleCheck className="text-green-500 mr-2" size={16} />
              <span className="font-medium">Observer:</span>
                              <span className="ml-1 text-gray-800">Notificación de distribución de solicitudes</span>
            </li>
            <li className="flex items-center">
              <CircleCheck className="text-green-500 mr-2" size={16} />
              <span className="font-medium">Chain of Responsibility:</span>
                              <span className="ml-1 text-gray-800">Procesamiento secuencial de solicitudes</span>
            </li>
            <li className="flex items-center">
              <CircleCheck className="text-green-500 mr-2" size={16} />
              <span className="font-medium">Round Robin:</span>
                              <span className="ml-1 text-gray-800">Algoritmo de distribución equilibrada</span>
            </li>
          </ul>
        </div>
        
        <div className="flex-1 bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2 flex items-center">
            <ServerIcon className="mr-2" size={20} />
            Servidores Activos
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {servers.map((server) => (
              <div key={server.id} className="border rounded p-2 flex items-center">
                <ServerIcon className="text-blue-500 mr-2" size={16} />
                <span>{server.id}</span>
                <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">{server.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-white p-4 rounded shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Share2 className="mr-2" size={20} />
              Simular Tráfico
            </h2>
            <button 
              onClick={generateRequest}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Generar Solicitud
            </button>
          </div>
          
          <h3 className="font-medium text-sm text-gray-700 mb-2">Cadena de Procesamiento:</h3>
          <div className="flex items-center justify-between mb-4 text-sm">
            <div className="flex flex-col items-center">
              <Lock className="text-purple-500 mb-1" size={20} />
              <span>Autenticación</span>
            </div>
            <div className="h-0.5 w-full max-w-16 bg-gray-300"></div>
            <div className="flex flex-col items-center">
              <Clock className="text-blue-500 mb-1" size={20} />
              <span>Logging</span>
            </div>
            <div className="h-0.5 w-full max-w-16 bg-gray-300"></div>
            <div className="flex flex-col items-center">
              <Eye className="text-green-500 mb-1" size={20} />
              <span>Validación</span>
            </div>
          </div>
          
          <h3 className="font-medium mb-2">Solicitudes Recientes:</h3>
          <div className="max-h-48 overflow-y-auto border rounded">
            {processedRequests.length > 0 ? (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-700">ID</th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-700">Tipo</th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-700">Ruta</th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-700">Servidor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {processedRequests.slice().reverse().map((req, index) => (
                    <tr key={index}>
                      <td className="px-2 py-1 text-xs text-gray-900">{req.request.id}</td>
                      <td className="px-2 py-1 text-xs text-gray-900">{req.request.type}</td>
                      <td className="px-2 py-1 text-xs text-gray-900">{req.request.path}</td>
                      <td className="px-2 py-1 text-xs text-gray-900">{req.server}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4 text-center text-gray-500">
                No hay solicitudes procesadas. Genera una solicitud.
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="mr-2" size={20} />
            Métricas de Distribución
          </h2>
          
          {Object.keys(metrics).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(metrics).map(([serverId, count]) => {
                const percentage = Object.values(metrics).reduce((sum, c) => sum + c, 0) > 0 
                  ? (count / Object.values(metrics).reduce((sum, c) => sum + c, 0) * 100).toFixed(1) 
                  : 0;
                
                return (
                  <div key={serverId} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{serverId}</span>
                      <span>{count} solicitudes ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-700">
              <p>No hay datos de métricas disponibles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadBalancerSystem;