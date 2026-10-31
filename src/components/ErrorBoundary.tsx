import React from 'react';
export default class ErrorBoundary extends React.Component<{children:React.ReactNode},{error:boolean}>{
 state={error:false};static getDerivedStateFromError(){return {error:true};}
 componentDidCatch(error:Error){console.error('Nexus Chat no pudo mostrar esta pantalla.',error);}
 render(){return this.state.error?<iframe title="Error de Nexus Chat" src="/error.html?mode=error" style={{position:'fixed',inset:0,width:'100%',height:'100%',border:0}}/>:this.props.children;}
}
