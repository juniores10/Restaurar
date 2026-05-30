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

<div class="cab-a">
     <div class="cab-1 container-fluid">
          <div class="row">
               <div class="col-md-1 text-left">
                    <a href="menu01.php"><br />
                         <img src="img/logo-03.png" class="img-fluid" alt="Logotipo da empresa PegaNet Informática"
                              title="Acesso ao site principal da PegaNet Informática" />
                    </a>
               </div>
               <div class="col-md-1 text-center">
                    <a href="man-empresa.php?ope=2&cod=1"><br />
                         <i class="fa fa-building-o fa-2x" aria-hidden="true"></i><br />PegaNet
                    </a>
               </div>
               <div class="col-md-1 text-center">
                    <a href="man-local.php?ope=1&cod=0"><br />
                         <i class="fa fa-map-marker fa-2x" aria-hidden="true"></i><br />Locais
                    </a>
               </div>
               <div class="col-md-1 text-center">
                    <a href="man-funcao.php?ope=1&cod=0"><br />
                         <i class="fa fa-handshake-o fa-2x" aria-hidden="true"></i><br />Funções
                    </a>
               </div>
               <div class="col-md-1 text-center">
                    <a href="man-setor.php?ope=1&cod=0"><br />
                         <i class="fa fa-map-o fa-2x" aria-hidden="true"></i><br />Setores
                    </a>
               </div>
               <div class="col-md-1 text-center">
                    <a href="man-cargo.php?ope=1&cod=0"><br />
                         <i class="fa fa-hand-paper-o fa-2x" aria-hidden="true"></i><br />Cargos
                    </a>
               </div>
               <div class="col-md-1 text-center">
                    <a href="man-tipodoc.php?ope=1&cod=0"><br />
                         <i class="fa fa-hand-paper-o fa-2x" aria-hidden="true"></i><br />Tipos Docto
                    </a>
               </div>
               <div class="col-md-1 text-center">
                    <a href="man-funcionario.php?ope=1&cod=0"><br />
                         <i class="fa fa-users fa-2x" aria-hidden="true"></i><br />Funcionários
                    </a>
               </div>
               <div class="col-md-1 text-center">
                    <a href="man-banco.php?ope=1&cod=0"><br />
                         <i class="fa fa-clock-o fa-2x" aria-hidden="true"></i><br />Banco Horas
                    </a>
               </div>
               <div class="col-md-1 text-center">
               <a href="man-escala.php?ope=1&cod=0"><br />
                         <i class="fa fa-calendar-check-o fa-2x" aria-hidden="true"></i><br />Escalas
                    </a>
               </div>
               <div class="col-md-1 text-center">
                    <a href="processos-sis.php"><br />
                         <i class="fa fa-cogs fa-2x" aria-hidden="true"></i><br />Importações
                    </a>
               </div>
               <div class="col-md-1 text-center">
                    <a href="man-usuario.php?ope=1&cod=0"><br />
                         <i class="fa fa-user fa-2x" aria-hidden="true"></i><br />Usuários
                    </a>
               </div>
               <div class="col-md-1 text-center">
                    <a href="log-usuario.php">
                         <div class="tit-1"><?php echo $_SESSION['wrknomusu']; ?></div>
                         <div class="tit-2"><?php echo date('d/m/Y H:i:s'); ?></div>
                         <div class="tit-2"><?php echo $_SESSION['wrkemausu']; ?></div>
                    </a>
                    <a href="fechar.php"><i class="fa fa-sign-out fa-2x" aria-hidden="true"></i></a><br />
               </div>
               <br />
          </div>
     </div>
</div>
<br />
<?php 


?>