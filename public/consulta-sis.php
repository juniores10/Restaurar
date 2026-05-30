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

     <script type="text/javascript" src="js/jquery.mask.min.js"></script>

     <script type="text/javascript" src="js/datepicker-pt-BR.js"></script>

     <link href="css/pallas56.css" rel="stylesheet" type="text/css" media="screen" />
     <title>Consultas - Gerenciamento de Colaboradores</title>
</head>

<script>
$(document).ready(function() {
     var alt = $(window).height();
     var lar = $(window).width();

     $('#dat_e').change(function() {
          $('#tab-e tbody').empty();
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
     $per = "";
     $del = "";
     $bot = "Salvar";
     include_once "dados.php";
     include_once "profsa.php";
     $_SESSION['wrkendser'] = getenv("REMOTE_ADDR");
     date_default_timezone_set("America/Sao_Paulo");

     if (isset($_SESSION['wrkopereg']) == false) { $_SESSION['wrkopereg'] = 0; }
     if (isset($_SESSION['wrkcodreg']) == false) { $_SESSION['wrkcodreg'] = 0; }
     if (isset($_REQUEST['ope']) == true) { $_SESSION['wrkopereg'] = $_REQUEST['ope']; }
     if (isset($_REQUEST['cod']) == true) { $_SESSION['wrkcodreg'] = $_REQUEST['cod']; }

     $dat_e = (isset($_REQUEST['dat_e']) == false ? date('d-m-Y')  : $_REQUEST['dat_e']);
     $lim_m = dia_mes($dat_e) + 1;

     $nro = leitura_reg("Select * from tb_funcionario where funstatus = 0 order by funnome, idfuncionario", $reg);
     foreach ($reg as $lin) {
          $dad['fun_c'][] = $lin['idfuncionario'];
          $dad['fun_n'][] = primeiro_nom(1, $lin['funnome']);
     }

?>

<body id="box00">
     <div class="container-fluid">
          <div class="row">
               <div id="men-2" class="cab-a col-md-2">
                    <?php include_once "cabecalho-2.php"; ?>
               </div>
               <div class="col-md-10">
                    <form id="frmConDad" name="frmConDad" action="consulta-sis.php" method="POST">
                         <br />
                         <div class="row">
                              <div class="col-md-2"></div>
                              <div class="col-md-8 text-center">
                                   <h3 class="cor-4"><strong>Visualização de Escala de Horários</strong></h3>
                              </div>
                              <div class="col-md-2 text-center">
                                   <button type="submit" name="car_e" class="bot-2"><i class="fa fa-search fa-2x"
                                             aria-hidden="true"></i></button>
                              </div>
                         </div>
                         <div class="row">
                              <div class="col-md-5"></div>
                              <div class="col-md-2 text-center">
                                   <label><strong>Mês Desejado</strong></label>
                                   <select id="dat_e" name="dat_e" class="form-control text-center">
                                        <?php
                                                  for ($ind = 1; $ind < 13; $ind++) {
                                                       if ($ind != date('m', strtotime($dat_e))) {
                                                            echo '<option value="01-' . str_pad($ind, 2, "0", STR_PAD_LEFT) . '-' . date('Y'). '">' .  mes_ano($ind) . '/' . date('Y'). '</option>';
                                                       } else {
                                                            echo '<option value="01-' . str_pad($ind, 2, "0", STR_PAD_LEFT) . '-' . date('Y'). '" selected="selected">' .  mes_ano($ind) . '/' . date('Y'). '</option>';
                                                       }
                                                  }
                                             ?>
                                   </select>
                              </div>
                              <div class="col-md-5"></div>
                         </div>
                         <br />
                         <div class="row">
                              <div class="tab-1 table-responsive">
                                   <table id="tab-e" class="table table-sm table-striped">
                                        <thead>
                                             <tr>
                                                  <th width="5%" class="text-center">Data</th>
                                                  <th width="7%" class="text-center">Semana</th>
                                                  <?php
                                                       foreach ($dad['fun_n'] as $ind => $cpo) {
                                                            echo '<th class="text-center">' . $cpo . '</th>';
                                                       }
                                                  ?>
                                             </tr>
                                        </thead>
                                        <tbody>
                                             <?php
                                                  for ($ind = 1; $ind < $lim_m; $ind++) {
                                                       $dat = str_pad($ind, 2, "0", STR_PAD_LEFT) . '/'. date('m/Y', strtotime($dat_e));
                                                       if (date('w', strtotime(inverte_dat(1, str_pad($ind, 2, "0", STR_PAD_LEFT) . '/'. date('m/Y', strtotime($dat_e))))) != 0 && date('w', strtotime(inverte_dat(1, str_pad($ind, 2, "0", STR_PAD_LEFT) . '/'. date('m/Y', strtotime($dat_e))))) != 6) {
                                                            echo '<tr>';
                                                       } else {
                                                            echo '<tr class="cor-1">';
                                                       }
                                                       echo '<td>' . $dat . '</td>';
                                                       echo '<td class="text-center">' . semana_dia( inverte_dat(1, str_pad($ind, 2, "0", STR_PAD_LEFT) . '/'. date('m/Y', strtotime($dat_e))) ) . '</td>';
                                                       echo carrega_esc($dat, $dad);
                                                       echo '</tr>';
                                                  }
                                             ?>
                                        </tbody>
                                   </table>
                              </div>
                         </div>
                    </form>
               </div>
          </div>
     </div>
     <div class="row">
          <img class="subir" src="img/subir.png" />
     </div>
</body>
<?php
     function carrega_esc($dat, $dad) {
          $txt = "";
          include_once "dados.php";
          foreach ($dad['fun_c'] as $ind => $cpo) {
               $nro = acessa_reg("Select E.*, L.locfantasia from (tb_escala E left join tb_local L on E.esclocal = L.idlocal) where escfuncionario = " . $cpo . " and escdata_3 = '" . inverte_dat(1, $dat) . "'", $reg);
               if ($nro == 0) {
                    $txt .= '<td class="text-center">' . '**:**' . '</td>';
               } else if($nro == 1) {
                    $txt .= '<td class="text-center">' . date('H:i', strtotime($reg['escdata_1'])) . '<br />' . $reg['locfantasia'] . '</td>';
               } else {
                    $txt .= '<td class="text-center">' . '##:##' . '</td>';
               }
          }
          return $txt;
     }
?>

</html>