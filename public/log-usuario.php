<?php session_start(); ?>
<!DOCTYPE html>
<html lang="pt_br">

<head>
     <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
     <meta name="description" content="Profsa Informática - Gerenciamento de Colaboradores" />
     <meta name="author" content="Paulo Rogério Souza" />
     <meta name="viewport" content="width=device-width, initial-scale=1" />

     <link href="https://fonts.googleapis.com/css?family=Lato:300,400" rel="stylesheet" type="text/css" />
     <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,400" rel="stylesheet" type="text/css" />

     <link href="//maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet">

     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.5.2/animate.css">

     <link rel="shortcut icon" href="https://www.profsa.com.br/pallas56/img/logo-00.png" />

     <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>

     <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

     <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css"
          integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
     <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js"
          integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossorigin="anonymous">
     </script>
     <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js"
          integrity="sha384-ChfqqxuZUCnJSK3+MXmPNIyE6ZbWh2IMqE241rYiqJxyMiZ6OW/JmZQ5stwEULTy" crossorigin="anonymous">
     </script>

     <script type="text/javascript" language="javascript"
          src="https://cdn.datatables.net/1.10.15/js/jquery.dataTables.min.js"></script>
     <link href="https://cdn.datatables.net/1.10.15/css/jquery.dataTables.min.css" rel="stylesheet" type="text/css" />

     <link rel="stylesheet" href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
     <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script>

     <script type="text/javascript" src="js/datepicker-pt-BR.js"></script>

     <script type="text/javascript" src="js/jquery.mask.min.js"></script>

     <link href="css/pallas56.css" rel="stylesheet" type="text/css" media="screen" />
     <title>Cargos - Gerenciamento de Colaboradores</title>
</head>

<script>
$(function() {
     $("#dti").mask("99/99/9999");
     $("#dtf").mask("99/99/9999");
     $("#dti").datepicker($.datepicker.regional["pt-BR"]);
     $("#dtf").datepicker($.datepicker.regional["pt-BR"]);
});

$(document).ready(function() {
     $('#dti').change(function() {
          $('#tab-0 tbody').empty();
     });

     $('#dtf').change(function() {
          $('#tab-0 tbody').empty();
     });

     $('#tab-0').DataTable({
          "pageLength": 50,
          "aaSorting": [
               [1, 'desc'],
               [2, 'desc']
          ],
          "language": {
               "lengthMenu": "Demonstrar _MENU_ linhas por páginas",
               "zeroRecords": "Não existe registros a demonstrar ...",
               "info": "Mostrada página _PAGE_ de _PAGES_",
               "infoEmpty": "Sem registros de log de acesso do usuário ...",
               "sSearch": "Buscar:",
               "infoFiltered": "(Consulta de _TOTAL_/_MAX_ total de linhas)",
               "oPaginate": {
                    sFirst: "Primeiro",
                    sLast: "Último",
                    sNext: "Próximo",
                    sPrevious: "Anterior"
               }
          }
     });

     $(window).scroll(function() {
          if ($(this).scrollTop() > 100) {
               $(".subir").fadeIn(500);
          } else {
               $(".subir").fadeOut(250);
          }
     });

     $(".subir").click(function() {
          $topo = $("#box00").offset().top;
          $('html, body').animate({
               scrollTop: $topo
          }, 1500);
     });

});
</script>

<?php
     $ret = 0; 
     include_once "dados.php";
     include_once "profsa.php";
     $_SESSION['wrknompro'] = __FILE__;
     date_default_timezone_set("America/Sao_Paulo");
     if (isset($_SERVER['HTTP_REFERER']) == true) {
          if (limpa_pro($_SESSION['wrknompro']) != limpa_pro($_SERVER['HTTP_REFERER'])) {
               $_SESSION['wrkproant'] = limpa_pro($_SERVER['HTTP_REFERER']);
               $ret = gravar_log(10,"Entrada na página de log de usuário do sistema");  
          }
     }
     $dti = date('d/m/Y', strtotime('-6 days'));
     $dtf = date('d/m/Y');
     $dti = (isset($_REQUEST['dti']) == false ? $dti : $_REQUEST['dti']);
     $dtf = (isset($_REQUEST['dtf']) == false ? $dtf : $_REQUEST['dtf']);
 
?>

<body id="box00">
     <div class="container-fluid">
          <div class="row">
               <div id="men-2" class="cab-a col-md-2">
                    <?php include_once "cabecalho-2.php"; ?>
               </div>
               <div class="col-md-10 text-center">
                    <div class="row">
                         <div class="col-md-12 text-center">
                              <span class="lit-1">Consulta de Log de Acesso</span>
                         </div>
                    </div>
                    <br />
                    <form class="qua-2" name="frmTelMan" action="" method="POST">
                         <div class="row">
                              <div class="col-md-4"></div>
                              <div class="col-md-2">
                                   <label>Data Inicial</label>
                                   <input type="text" class="form-control text-center" maxlength="10" id="dti"
                                        name="dti" value="<?php echo $dti; ?>" required />
                              </div>
                              <div class="col-md-2">
                                   <label>Data Final</label>
                                   <input type="text" class="form-control text-center" maxlength="10" id="dtf"
                                        name="dtf" value="<?php echo $dtf; ?>" required />
                              </div>
                              <div class="col-md-2"></div>
                              <div class="col-md-1 text-center">
                                   <br />
                                   <button type="submit" id="con" name="consulta" class="bot-2"
                                        title="Carrega ocorrências conforme periodo solicitado pelo usuário."><i
                                             class="fa fa-search fa-2x" aria-hidden="true"></i></button>
                              </div>
                              <div class="col-md-1 text-center">
                                   <?php if ($_SESSION['wrktipusu'] == 5) { ?>
                                   <br />
                                   <button type="submit" id="del" name="deleta" class="bot-2"
                                        onclick="return confirm('Confirma exclusão de Log´s dentro do periodo informado ?')"
                                        title="Deleta registro de Log dentro do periodo informado nos campos anteriores pelo usuário."><i
                                             class="fa fa-trash fa-2x" aria-hidden="true"></i></button>
                                   <?php } ?>
                              </div>
                         </div>
                         <br />
                    </form>
                    <br />
                    <div class="row">
                         <div class="col-md-12">
                              <br />
                              <div class="tab-1 table-responsive">
                                   <table id="tab-0" class="table table-sm table-striped">
                                        <thead>
                                             <tr>
                                                  <th>Data</th>
                                                  <th>Hora</th>
                                                  <th>Ope</th>
                                                  <th>Usuário</th>
                                                  <th>Tip</th>
                                                  <th>Página</th>
                                                  <th>IP</th>
                                                  <th>Cidade/UF</th>
                                                  <th>Navegador</th>
                                                  <th>Provedor</th>
                                                  <th>Histórico do Log</th>
                                             </tr>
                                        </thead>
                                        <tbody>
                                             <?php $ret = carrega_log($dti, $dtf);  ?>
                                        </tbody>
                                   </table>
                                   <br />
                              </div>
                         </div>
                    </div>


               </div>
          </div>
          <div class="row">
               <img class="subir" src="img/subir.png" />
          </div>
     </div>
     <div id="box10">
          <img class="subir" src="img/subir.png" title="Volta a página para o seu topo." />
     </div>
</body>
<?php 
     function carrega_log($dti, $dtf) {
          $nro = 0;
          include_once "dados.php";
          $dti = substr($dti,6,4) . "-" . substr($dti,3,2) . "-" . substr($dti,0,2) . " 00:00:00";
          $dtf = substr($dtf,6,4) . "-" . substr($dtf,3,2) . "-" . substr($dtf,0,2) . " 23:59:59";
          $com = "Select * from tb_log where logdatahora between '" . $dti . "' and '" . $dtf . "' ";
          $com .= " order by logempresa, logdatahora desc, idlog ";          
          $nro = leitura_reg($com, $lin);
          foreach ($lin as $reg) {               
               $txt =  '<tr>';
               $txt .= "<td>" . date('d/m/Y',strtotime($reg['logdatahora'])) . "</td>";
               $txt .= "<td>" . date('H:m:s',strtotime($reg['logdatahora'])) . "</td>";
               $txt .= "<td>" . $reg['logoperacao'] . "</td>";
               $txt .= "<td>" . $reg['logusuario'] . "</td>";
               $txt .= "<td>" . $reg['logtipo'] . "</td>";
               $txt .= "<td>" . $reg['logprograma'] . "</td>";
               $txt .= "<td>" . $reg['logip'] . "</td>";
               $txt .= "<td>" . $reg['logcidade'] . "-" . $reg['logestado'] . "</td>";
               $txt .= "<td>" . $reg['lognavegador'] . "</td>";
               $txt .= "<td>" . $reg['logprovedor'] . "</td>";
               $txt .= "<td>" . $reg['logobservacao'] . "</td>";
               $txt .= "</tr>";
               echo $txt;
          }
          return $nro;     }
?>

</html>