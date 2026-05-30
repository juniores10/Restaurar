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

     <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.0/Chart.min.js"></script>

     <script type="text/javascript" src="js/jquery.mask.min.js"></script>

     <link href="css/pallas56.css" rel="stylesheet" type="text/css" media="screen" />
     <title>PegaNet - Gerenciamento de Colaboradores</title>
</head>

<script>
$(document).ready(function() {

     localStorage.removeItem('fun_t');
     localStorage.removeItem('ban_t');
     localStorage.removeItem('esc_t');

     var alt = $(window).height();
     var lar = $(window).width();

     $('#tab-0').DataTable({
          "pageLength": 50,
          "aaSorting": [
               [2, 'asc'],
               [1, 'asc']
          ],
          "language": {
               "lengthMenu": "Demonstrar _MENU_ linhas por páginas",
               "zeroRecords": "Não existe registros a demonstrar ...",
               "info": "Mostrada página _PAGE_ de _PAGES_",
               "infoEmpty": "Sem registros de funcionários ...",
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

     $('#men-2').css('height', $('#men-3').height() + 'px');

     $("form").on("click", ".foto", function() {
          var cam = $(this).attr("cam");
          $('#fot-f').attr('src', cam);
          $('#fot-fun').modal('show');
     });

     $("form").on("click", ".ban_h", function() {
          var cod = $(this).attr("cod");
          $.getJSON("ajax/men-car-banco.php", {
                    cod: cod
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#tel-ban').text(data.tit);
                         $('#dad-b').html(data.txt);
                         $('#sal-h').text('Saldo de Horas: ' + data.sal);
                         $('#sal-h').addClass(data.cor);
                         $('#dad-ban').modal('show');
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no carregamento de dados do banco de horas");
                    $.get("ajax/err-env-email.php", {
                         erro: JSON.stringify(data),
                    });
               });
     });

     $("form").on("click", ".esc_d", function() {
          var cod = $(this).attr("cod");
          $.getJSON("ajax/men-car-escala.php", {
                    cod: cod
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#tel-esc').text(data.tit);
                         $('#dad-e').html(data.txt);
                         $('#dad-esc').modal('show');
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no carregamento de dados da escala de horas");
               });
     });

     $("#ani_m").click(function() {
          $.getJSON("ajax/men-mes-niver.php", {
                    tip: 0
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#tel-esc').html(
                              'Nossos Aniversariantes - Feliz Aniversário a Todos <i class="fa fa-birthday-cake fa-1g" aria-hidden="true"></i></i>'
                         );
                         $('#dad-e').html(data.txt);
                         $('#dad-esc').modal('show');
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no carregamento de dados de aniversariantes do mês");
               });
     });

     $("#qua_a").click(function() {
          $.getJSON("ajax/men-qua-aviso.php", {
                    tip: 0
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#tel-esc').html('Quadro de Avisos aos Colaboradores');
                         $('#dad-e').html(data.txt);
                         $('#dad-esc').modal('show');
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no carregamento de dados do quadro de avisos");
               });
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
     $_SESSION['wrkendser'] = getenv("REMOTE_ADDR");
     date_default_timezone_set("America/Sao_Paulo");

     $end_h = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
     $tip_e = $_SERVER['HTTP_HOST'];
     $end_u = $_SERVER['REQUEST_URI'];

     $_SESSION['wrkendlog'] = $end_h . $tip_e . str_replace("menu02.php", "", $end_u);   

     $ret = aniversarios_mes();

?>

<body id="box00">
     <h1 class="cab-0">Menu Sistema Gerenciamento de Colaboradores - Profsa Informática</h1>
     <div class="container-fluid">
          <form id="frmTelMan" name="frmTelMan" action="man-funcionario.php" method="POST">
               <div class="row">
                    <div id="men-2" class="cab-a col-md-2">
                         <?php include_once "cabecalho-2.php"; ?>
                    </div>
                    <div id="men-3" class="col-md-10">
                         <div class="fun-2">
                              <div class="row text-center">
                                   <div class="col-md-4"></div>
                                   <div class="col-md-4">
                                        <p class="lit-3">Colaboradores</p>
                                   </div>
                                   <div class="col-md-4"></div>
                              </div>
                              <div class="form-row text-center">
                                   <div class="col-md-4"></div>
                                   <div class="col-md-1">
                                        <i id="qua_a" class="cur-1 cor-4 fa fa-bullhorn fa-2x" aria-hidden="true"
                                             title="Abre página para visualizar os avisos para os colaboradores de nossa empresa."></i><br />
                                        <span class="tit-1">Quadro de Avisos</span>
                                   </div>
                                   <div class="col-md-1">
                                        <i id="ani_m" class="cur-1 cor-4 fa fa-birthday-cake fa-2x" aria-hidden="true"
                                             title="Abre página para visualizar os aniversariantes do mês e do próximo."></i><br />
                                        <span class="tit-1">Aniversariantes</span>
                                   </div>
                                   <div class="col-md-1">
                                        <a href="consulta-sis.php"><i class="cor-4 fa fa-calendar fa-2x"
                                                  aria-hidden="true"
                                                  title="Abre página para visualizar escala de horários dos funcionários"></i></a><br />
                                        <span class="tit-1">Escala de Horários</span>
                                   </div>
                                   <div class="col-md-5"></div>
                              </div>
                         </div>
                         <br />
                         <div class="row">
                              <div class="tab-1 table-responsive">
                                   <table id="tab-0" class="table table-sm table-striped">
                                        <thead>
                                             <tr>
                                                  <th width="3%" class="text-center">Código</th>
                                                  <th width="3%">Status</th>
                                                  <th>Nome do Colaborador</th>
                                                  <th>Matrícula</th>
                                                  <th>E-Mail</th>
                                                  <th class="text-center">Nascimento</th>
                                                  <th class="text-center">Idade</th>
                                                  <th>Numero CPF</th>
                                                  <th>Carga</th>
                                                  <th>Horário</th>
                                                  <th>Banco</th>
                                                  <th>Setor</th>
                                                  <th>Cargo</th>
                                                  <th>Função</th>
                                                  <th>Foto</th>
                                                  <th>Banco</th>
                                                  <th>Escala</th>
                                             </tr>
                                        </thead>
                                        <tbody>
                                             <?php $ret = carrega_col();  ?>
                                        </tbody>
                                   </table>
                              </div>
                         </div>
                    </div>
               </div>
          </form>
          <!------------------------------------------------------------------------------------------------------------------------------------------------------>
          <div class="modal fade" id="fot-fun" tabindex="-1" role="dialog" aria-labelledby="tel-fot" aria-hidden="true"
               data-backdrop="true">
               <div class="modal-dialog modal-lg" role="document">
                    <!-- modal-sm modal-lg modal-xl -->
                    <form id="frmMosFot" name="frmMosFot" action="menu02.php" method="POST">
                         <div class="modal-content">
                              <div class="modal-header bg-primary text-white">
                                   <h5 class="modal-title" id="tel-fot">Demonstração de Foto do Funcionário</h5>
                                   <button type="button" class="close" data-dismiss="modal" aria-label="Fechar">
                                        <span aria-hidden="true">&times;</span>
                                   </button>
                              </div>
                              <div class="modal-body">
                                   <div class="form-row text-center">
                                        <div class="col-md-12">
                                             <img id="fot-f" class="img-fluid" src="" />
                                        </div>
                                   </div>
                                   <br />
                              </div>
                              <div class="modal-footer">
                                   <button type="button" id="fec_f" name="fec_f" class="btn btn-outline-danger"
                                        data-dismiss="modal">Fechar</button>
                              </div>
                         </div>
                    </form>
               </div>
          </div>
          <!------------------------------------------------------------------------------------------------------------------------------------------------------>
          <div class="modal fade" id="dad-ban" tabindex="-1" role="dialog" aria-labelledby="tel-ban" aria-hidden="true"
               data-backdrop="true">
               <div class="modal-dialog modal-lg" role="document">
                    <!-- modal-sm modal-lg modal-xl -->
                    <form id="frmMosDoc" name="frmMosDoc" action="menu02.php" method="POST">
                         <div class="modal-content">
                              <div class="modal-header bg-primary text-white">
                                   <h5 class="modal-title" id="tel-ban">Demonstração de Banco de Horas</h5>
                                   <button type="button" class="close" data-dismiss="modal" aria-label="Fechar">
                                        <span aria-hidden="true">&times;</span>
                                   </button>
                              </div>
                              <div class="modal-body">
                                   <div class="form-row text-center">
                                        <div class="col-md-12">
                                             <div id="dad-b"></div>
                                        </div>
                                   </div>
                                   <br />
                                   <div class="form-row">
                                        <div class="col-md-12 text-center">
                                             <strong>
                                                  <h3>
                                                       <div id="sal-h"></div>
                                                  </h3>
                                             </strong>
                                        </div>
                                   </div>
                                   <br />
                              </div>
                              <div class="modal-footer">
                                   <button type="button" id="fec_b" name="fec_b" class="btn btn-outline-danger"
                                        data-dismiss="modal">Fechar</button>
                              </div>
                         </div>
                    </form>
               </div>
          </div>
          <!------------------------------------------------------------------------------------------------------------------------------------------------------>
          <div class="modal fade" id="dad-esc" tabindex="-1" role="dialog" aria-labelledby="tel-esc" aria-hidden="true"
               data-backdrop="true">
               <div class="modal-dialog modal-lg" role="document">
                    <!-- modal-sm modal-lg modal-xl -->
                    <form id="frmMosEsc" name="frmMosEsc" action="menu02.php" method="POST">
                         <div class="modal-content">
                              <div class="modal-header bg-primary text-white">
                                   <h5 class="modal-title" id="tel-esc">Demonstração de Escala de Trabalho</h5>
                                   <button type="button" class="close" data-dismiss="modal" aria-label="Fechar">
                                        <span aria-hidden="true">&times;</span>
                                   </button>
                              </div>
                              <div class="modal-body">
                                   <div class="form-row">
                                        <div class="col-md-12">
                                             <div id="dad-e"></div>
                                        </div>
                                   </div>
                              </div>
                              <div class="modal-footer">
                                   <button type="button" id="fec_b" name="fec_b" class="btn btn-outline-danger"
                                        data-dismiss="modal">Fechar</button>
                              </div>
                         </div>
                    </form>
               </div>
          </div>
          <!------------------------------------------------------------------------------------------------------------------------------------------------------>
          <div class="row">
               <img class="subir" src="img/subir.png" />
          </div>
     </div>
</body>
<?php
function carrega_col() {
     $ret = 0;
     include_once "dados.php";
     $com = "Select F.*, S.daddescricao as setnome, C.daddescricao as carnome, X.daddescricao as fcanome from (((tb_funcionario F left join tb_dados S on F.funsetor = S.iddados) left join tb_dados C on F.funcargo = S.iddados) left join tb_dados X on F.funfuncao = X.iddados)";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          $txt =  '<tr>';
          $txt .= '<td class="text-center">' . $lin['idfuncionario'] . '</td>';
          if ($lin['funstatus'] == 0) {$txt .= "<td>" . "" . "</td>";}
          if ($lin['funstatus'] == 1) {$txt .= "<td>" . "Férias" . "</td>";}
          if ($lin['funstatus'] == 2) {$txt .= "<td>" . "Suspenso" . "</td>";}
          if ($lin['funstatus'] == 3) {$txt .= "<td>" . "Afastado" . "</td>";}
          if ($lin['funstatus'] == 4) {$txt .= "<td>" . "Desligado" . "</td>";}
          $txt .= '<td>' . $lin['funnome'] . '</td>';
          $txt .= '<td>' . $lin['funmatricula'] . '</td>';
          $txt .= '<td>' . $lin['funemail'] . '</td>';
          if ($lin['funnascimento']  == null) {
               $txt .= '<td>' . '' . '</td>';
          } else {
               $txt .= '<td class="text-center">' . date('d/m/Y', strtotime($lin['funnascimento'])) . '</td>';
          }
          $txt .= '<td class="text-center">' . calcula_idade($lin['funnascimento'])  . '</td>';
          $txt .= '<td>' . mascara_cpo($lin['funnumerocpf'], "   .   .   -  ") . '</td>';
          $txt .= '<td class="text-center">' . $lin['funcarga'] . '</td>';
          $txt .= '<td>' . $lin['funhora1'] . ':' . $lin['funhora2'] . '-' . $lin['funhora3'] . ':' . $lin['funhora4'] . '</td>';
          $txt .= '<td class="text-center">' . banco_hor($lin['idfuncionario']) . 'hrs</td>';
          $txt .= '<td>' . $lin['setnome'] . '</td>';
          $txt .= '<td>' . $lin['carnome'] . '</td>';
          $txt .= '<td>' . $lin['fcanome'] . '</td>';
          $cam = existe_fot($lin['idfuncionario']);
          if ($cam == "") {
               $txt .= '<td class="text-center">' . '<i class="cur-2 fa fa-address-book-o fa-3x" aria-hidden="true"></i>' . '</td>';
          } else {
               $txt .= '<td class="text-center">' . '<img class="foto cur-1 ima-3" src=' . $cam . ' cam=' . $cam . ' />' . '</td>';
          }
          $txt .= '<td class="text-center">' . '<i class="ban_h cur-1 cor-4 fa fa-clock-o fa-3x" aria-hidden="true" cod=' . $lin['idfuncionario'] . '></i>' . '</td>';
          $txt .= '<td class="text-center">' . '<i class="esc_d cur-1 cor-4 fa fa-calendar-check-o fa-3x" aria-hidden="true" cod=' . $lin['idfuncionario'] . '></i>' . '</td>';
          $txt .= "</tr>";
          echo $txt;
     }
     return $ret;
}

function banco_hor($cod) {
     $qtd = 0; $min = 0;
     include_once "dados.php";
     $dti = date('Y') . '/' . date('m') . '/' . '01';
     $dtf = date('Y') . '/' . date('m') . '/' . dia_mes(date('d/m/Y'));
     $com = "Select * from tb_horas where horfuncionario = " . $cod . " and hordata between '" . $dti . "' and '" . $dtf . "' ";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          $hor = explode(":", $lin['horentra1']);  
          if (isset($hor[1]) == true) {
               $qtd = $qtd + $hor[0];
               $min = $min + $hor[1];
          }
     }
     $qtd = $qtd + ($min / 60);
     return round($qtd, 0);
}

function aniversarios_mes() {
     $ret = 0; $tex = "";
     include_once "dados.php";
     $dti = date('Y') . '-' . date('m') . '-' . '01'; $dtf = date('Y') . '-' . date('m') . '-' .  dia_mes(date('d/m/Y')); 
     $nro = leitura_reg("Select * from tb_funcionario where funstatus = 0 and funopcaoniv = 0 and funemail <> '' order by funnome, idfuncionario", $reg);
     foreach ($reg as $lin) {
          if (date('m') == date('m', strtotime($lin['funnascimento']))) {
               $nom = primeiro_nom(1, $lin['funnome']);
               $fot = __DIR__ . '/' . $_SESSION['wrkfotusu'];
               $tex  = '<!DOCTYPE html>';
               $tex .= '<html lang="pt_br">';
               $tex .= '<head>';
               $tex .= '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />';
               $tex .= '<title>PegaNet - Gerenciamento de Funcionários</title>';
               $tex .= '<style type="text/css"> 
                    .fun-01 {
                         width: 530px;
                         height: 1100px;
                         margin: 5px 150px;
                         text-align: center;
                         background: #0a3e78; 
                         background: -moz-linear-gradient(-45deg, #073870 10%, #577398 51%); 
                         background: -webkit-linear-gradient(-45deg, #073870 10%,#577398 51%); 
                         background: linear-gradient(135deg, #073870 10%,#577398 51%);
                         }
                    .lit-01 {
                         color: #ffffff;
                         text-align: center;
                         font-size: 44px;
                         font-weight: bold;
                         }
                    .lit-02 {
                         color: #ffffff;
                         text-align: center;
                         font-size: 20px;
                         font-style: italic;
                         font-weight: bold;
                    }
                    .ima-01 {
                              width: 350px;
                              height: 350px;
                              margin: 10px 50px;
                              border-radius: 50%;
                         }

                    </style>';
               $tex .= '</head>';
               $tex .= '<body>'; 
               $tex .= '<div class="fun-01">'; 
               $tex .= '<img src="https://www.profsa.com.br/pallas56/img/niver-02.png" />';
               $tex .= '<img src="https://www.profsa.com.br/pallas56/img/niver-03.png" />';
               $tex .= '<br /><br />'; 
               $tex .= '<img class="ima-01" src="' . $fot . '" />';
               $tex .= '<p class="lit-01">' . $nom . '</p>';
               $tex .= '<p class="lit-02">' . 'Para você os melhores votos de toda a nossa equipe de um Feliz Aniversário com muita paz, saúde e sucesso. <br /> Obrigado por fazer parte de nossa história !' . '</p>';
               $tex .= '<img src="https://www.profsa.com.br/pallas56/img/logo-04.png" />';
               $tex .= '<br /><br />'; 
               $tex .= '</div>';
               $tex .= '</body>';
               $tex .= '</html>';
               $asu = "Parabéns pelo seu Aniversário - By PegaNet";
     
               $sta = manda_email($lin['funemail'] , $asu, $tex, $lin['funnome'], '', '');
               if ($sta == 1) {     
                    $sql  = "update tb_funcionario set ";
                    $sql .= "funopcaoniv = '". '1' . "', ";
                    $sql .= "keyalt = '" . $_SESSION['wrkideusu'] . "', ";
                    $sql .= "datalt = '" . date("Y/m/d H:i:s") . "' ";
                    $sql .= "where idfuncionario = " . $lin['idfuncionario'];
                    $ret = comando_tab($sql, $nro, $ult, $men);
                    if ($ret == false) {
                         $tab['men'] = $sql;
                    }          
               }
          }
     }
     if (date('m-d') <= '01-10') {
          $sql  = "update tb_funcionario set ";
          $sql .= "funopcaoniv = '". '0' . "', ";
          $sql .= "keyalt = '" . $_SESSION['wrkideusu'] . "', ";
          $sql .= "datalt = '" . date("Y/m/d H:i:s") . "' ";
          $sql .= "where idfuncionario >= 0";
          $ret = comando_tab($sql, $nro, $ult, $men);
          if ($ret == false) {
               $tab['men'] = $sql;
          }          
     }
     return $ret;
}
?>

</html>