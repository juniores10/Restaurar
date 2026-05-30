<?php 
     include_once "profsa.php";
     $_SESSION['wrknompro'] = __FILE__;
     date_default_timezone_set("America/Sao_Paulo");

     if (isset($_SESSION['wrknomusu']) == false) {
          exit('<script>location.href = "index.php"</script>');   
     } elseif ($_SESSION['wrknomusu'] == "") {
          exit('<script>location.href = "index.php"</script>');   
     } elseif ($_SESSION['wrknomusu'] == "*") {
          exit('<script>location.href = "index.php"</script>');   
     } elseif ($_SESSION['wrknomusu'] == "#") {
          exit('<script>location.href = "index.php"</script>');   
     }   
?>

<nav class="navbar navbar-expand-lg navbar-light">
     <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#conteudoNavbarSuportado"
          aria-controls="conteudoNavbarSuportado" aria-expanded="false" aria-label="Alterna navegação">
          <span class="navbar-toggler-icon"></span>
     </button>
     <div class="collapse navbar-collapse" id="conteudoNavbarSuportado">
          <ul class="nav flex-column">
               <li class="nav-item text-center">
                    <a href="menu02.php"><img class="img-fluid" src="img/logo-05.png" /></a>
                    <hr />
               </li>
               <li class="nav-item text-center">
                    <img id="ima_u" class="ima-1 img-fluid" src="<?php echo $_SESSION['wrkfotusu'] ?>" />
                    <a href="log-usuario.php">
                         <div class="tit-4"><?php echo $_SESSION['wrknomusu']; ?></div>
                         <div class="tit-2"><?php echo date('d/m/Y H:i:s'); ?></div>
                         <div class="tit-2"><?php echo $_SESSION['wrkemausu']; ?></div>
                    </a>
                    <hr />
               </li>
               <li class="nav-item">
                    <a class="nav-link" href="menu02.php"><i class="fa fa-home fa-1g"
                              aria-hidden="true"></i> &nbsp; &nbsp;
                         <span class="lit-2">Dashboard</span></a>
               </li>
               <li class="nav-item">
                    <a class="nav-link" href="man-empresa.php?ope=2&cod=1"><i class="fa fa-building-o fa-1g"
                              aria-hidden="true"></i> &nbsp; &nbsp;
                         <span class="lit-2">PegaNet</span></a>
               </li>
               <li class="nav-item">
                    <a class="nav-link" href="man-agenda.php?ope=1&cod=0"><i class="fa fa-calendar fa-1g"
                              aria-hidden="true"></i> &nbsp; &nbsp; &nbsp;
                         <span class="lit-2">Agenda</span></a>
               </li>
               <li class="nav-item">
                    <a class="nav-link" href="man-local.php?ope=1&cod=0"><i class="fa fa-map-marker fa-1g"
                              aria-hidden="true"></i> &nbsp; &nbsp; &nbsp;
                         <span class="lit-2">Locais</span></a>
               </li>
               <li class="nav-item">
                    <a class="nav-link" href="man-funcao.php?ope=1&cod=0"><i class="fa fa-handshake-o fa-1g"
                              aria-hidden="true"></i> &nbsp; &nbsp;
                         <span class="lit-2">Funções</span></a>
               </li>
               <li class="nav-item">
                    <a class="nav-link" href="man-setor.php?ope=1&cod=0"><i class="fa fa-map-o fa-1g"
                              aria-hidden="true"></i> &nbsp; &nbsp;
                         <span class="lit-2">Setores</span></a>
               </li>
               <li class="nav-item">
                    <a class="nav-link" href="man-cargo.php?ope=1&cod=0"><i class="fa fa-hand-paper-o fa-1g"
                              aria-hidden="true"></i> &nbsp; &nbsp;
                         <span class="lit-2">Cargos</span></a>
               </li>
               <li class="nav-item">
                    <a class="nav-link" href="man-assunto.php?ope=1&cod=0"><i class="fa fa-filter fa-1g"
                              aria-hidden="true"></i> &nbsp; &nbsp;
                         <span class="lit-2">Assuntos</span></a>
               </li>
               <li class="nav-item">
                    <a class="nav-link" href="man-tipodoc.php?ope=1&cod=0"><i class="fa fa-file-text-o fa-1g"
                              aria-hidden="true"></i> &nbsp; &nbsp;
                         <span class="lit-2">Tipos Docto</span></a>
               </li>
               <li class="nav-item">
                    <a class="nav-link" href="man-funcionario.php?ope=1&cod=0"><i class="fa fa-users fa-1g"
                              aria-hidden="true"></i> &nbsp; &nbsp;
                         <span class="lit-2">Funcionários</span></a>
               </li>
               <li class="nav-item">
                    <a class="nav-link" href="man-banco.php?ope=1&cod=0"><i class="fa fa-clock-o fa-1g"
                              aria-hidden="true"></i> &nbsp; &nbsp;
                         <span class="lit-2">Banco Horas</span></a>
               </li>
               <li class="nav-item">
                    <a class="nav-link" href="man-escala.php?ope=1&cod=0"><i class="fa fa-calendar-check-o fa-1g"
                              aria-hidden="true"></i> &nbsp;
                         &nbsp;
                         <span class="lit-2">Escalas</span></a>
               </li>
               <li class="nav-item">
                    <a class="nav-link" href="man-frota.php?ope=1&cod=0"><i class="fa fa-car fa-1g"
                              aria-hidden="true"></i> &nbsp; &nbsp;
                         <span class="lit-2">Frota</span></a>
               </li>
               <li class="nav-item">
                    <a class="nav-link" href="man-usuario.php?ope=1&cod=0"><i class="fa fa-user fa-1g"
                              aria-hidden="true"></i> &nbsp; &nbsp;
                         <span class="lit-2">Usuários</span></a>
               </li>
               <li class="nav-item">
                    <a class="nav-link" href="processos-sis.php"><i class="fa fa-cogs fa-1g" aria-hidden="true"></i>
                         &nbsp; &nbsp;
                         <span class="lit-2">Importações</span></a>
               </li>
               <li class="nav-item">
                    <a class="nav-link" href="man-docto.php?ope=1&cod=0"><i class="fa fa-file-pdf-o fa-1g"
                              aria-hidden="true"></i> &nbsp; &nbsp;
                         <span class="lit-2">Documentos</span></a>
               </li>
               <li class="nav-item">
                    <a class="nav-link" href="man-producao.php?ope=1&cod=0"><i class="fa fa-briefcase fa-1g"
                              aria-hidden="true"></i> &nbsp; &nbsp;
                         <span class="lit-2">Produtividade</span></a>
               </li>
               <li class="nav-item">
                    <a class="nav-link" href="man-quadro.php?ope=1&cod=0"><i class="fa fa-envelope fa-1g"
                              aria-hidden="true"></i> &nbsp; &nbsp;
                         <span class="lit-2">Quadro de Avisos</span></a>
               </li>
               <li class="nav-item">
                    <a class="nav-link" href="man-sugestao.php?ope=1&cod=0"><i class="fa fa-handshake-o fa-1g"
                              aria-hidden="true"></i> &nbsp; &nbsp;
                         <span class="lit-2">Dicas e Sugestões</span></a>
               </li>
               <li class="nav-item">
                    <a class="nav-link" href="fechar.php"><i class="fa fa-sign-out fa-1g" aria-hidden="true"></i> &nbsp;
                         &nbsp;
                         <span class="lit-2">Saída</span></a>
               </li>
          </ul>
     </div>
</nav>