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
     <title>Frota (Veículos) - Gerenciamento de Colaboradores</title>
</head>

<script>
$(function() {
     $("#dat_v").mask("00/00/0000");
     $("#dat_v").datepicker($.datepicker.regional["pt-BR"]);
});

$(document).ready(function() {
     if (localStorage.doc_p == undefined) {
          $('#tel_c').hide();
          localStorage.setItem('doc_p', 1);
     }

     $('#men-2').css('height', $('#men-3').height() + 'px');

     $.getJSON("ajax/fro-pro-dados.php", {
               tip_o: 1,
          })
          .done(function(data) {
               if (data.men != "") {
                    alert(data.men);
               } else {
                    $('#cod_r').val(data.cod_r);
                    $('#lis_r').html(data.tab_l);
                    let ret = carrega_tab();
               }
          }).fail(function(data) {
               console.log(data);
               console.log('Erro: ' + JSON.stringify(data));
               alert("Erro ocorrido no processamento do registro do veículo");
          });

     $("#mos_t").click(function() {
          $('#tel_c').fadeToggle();
          $('#men-2').css('height', $('#men-3').height() + 'px');
     });

     $("#nov_r").click(function() {
          $.getJSON("ajax/fro-pro-dados.php", {
               tip_o: 1,
          })
          .done(function(data) {
               if (data.men != "") {
                    alert(data.men);
               } else {
                    $('#cod_r').val(data.cod_r);
                    $('#ope_r').val(1);
                    $('#fun_c').val(0);
                    $('#des_v').val('');
                    $('#pla_v').val('');
                    $('#ren_v').val('');
                    $('#sta_r').val(0);
                    $('#dat_v').val('');
                    $('#mul_v').val('');
                    $('#kil_r').val('');
                    $('#tem_p').val('');
                    $('#ale_v').val('');
                    $('#com_d').val('');
                    $('#obs_r').val('');
                    $('#tel_c').fadeIn();
                    $('#men-2').css('height', $('#men-3').height() + 'px');
               }
          }).fail(function(data) {
               console.log(data);
               console.log('Erro: ' + JSON.stringify(data));
               alert("Erro ocorrido no processamento do registro do veículo");
          });
     });

     $("#sal_r").click(function() {
          var dad = $('#frmTelMan').serialize();
          $.post("ajax/fro-pro-dados.php?tip_o=2", dad, function(data) {
               if (data.men != "") {
                    alert(data.men);
               } else {
                    $('#cod_r').val(data.cod_r);
                    $('#fun_c').val(0);
                    $('#des_v').val('');
                    $('#pla_v').val('');
                    $('#ren_v').val('');
                    $('#sta_r').val(0);
                    $('#dat_v').val('');
                    $('#mul_v').val('');
                    $('#kil_r').val('');
                    $('#tem_p').val('');
                    $('#ale_v').val('');
                    $('#com_d').val('');
                    $('#obs_r').val('');
                    $('#ope_r').val(1);
                    $('#frmTelMan').submit();
               }
          }, "json")
          .done(function() {

          }, "json")
          .fail(function(data) {
               console.log(JSON.stringify(data));
               alert("Erro ocorrido na gravação de dados do registro do veículo !");
          }, "json");
     });

     $("#dat_v").blur(function() {
          if ($("#dat_v").val() == "") {
               var dat = new Date;
               var ddd = ('0' + dat.getDate()).slice(-2);
               var mmm = ('0' + (dat.getMonth() + 1)).slice(-2);
               var aaa = dat.getFullYear();
               dat = ddd + "/" + mmm + "/" + aaa;
               $('#dat_v').val(dat);
          }
     });

     $("form").on("click", ".item", function() {
          var ope = $(this).attr("ope");
          var cod = $(this).attr("cod");
          $('#ope_r').val(ope);
          $('#cod_r').val(cod);
          $.getJSON("ajax/fro-pro-dados.php", {
               tip_o: 3,
               ope_r: ope,
               cod_r: cod,
          })
          .done(function(data) {
               if (data.men != "") {
                    alert(data.men);
               } else {
                    $('#fun_c').val(data.fun_c);
                    $('#des_v').val(data.des_v);
                    $('#pla_v').val(data.pla_v);
                    $('#ren_v').val(data.ren_v);
                    $('#sta_r').val(data.sta_r);
                    $('#dat_v').val(data.dat_v);
                    $('#mul_v').val(data.mul_v);
                    $('#kil_r').val(data.kil_r);
                    $('#tem_p').val(data.tem_p);
                    $('#ale_v').val(data.ale_v);
                    $('#com_d').val(data.com_d);
                    $('#obs_r').val(data.obs_r);
               }
          }).fail(function(data) {
               console.log(data);
               console.log('Erro: ' + JSON.stringify(data));
               alert("Erro ocorrido no processamento do registro do veículo");
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

     function carrega_tab() {
          let ret = 0;
          $('#tab-0').DataTable({
               "pageLength": 50,
               "aaSorting": [
                    [2, 'asc']
               ],
               "language": {
                    "lengthMenu": "Demonstrar _MENU_ linhas por páginas",
                    "zeroRecords": "Não existe registros a demonstrar ...",
                    "info": "Mostrada página _PAGE_ de _PAGES_",
                    "infoEmpty": "Sem registros de veículos ...",
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
          return ret;
     }
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

?>

<body id="box00">
     <div class="container-fluid">
          <div class="row">
               <div id="men-2" class="cab-a col-md-2">
                    <?php include_once "cabecalho-2.php"; ?>
               </div>
               <div id="men-3" class="col-md-10">
                    <br />
                    <div class="row">
                         <div class="col-md-10">
                              <h3 class="cor-4"><strong>Manutenção de Frota (Veículos)</strong></h3>
                         </div>
                         <div class="col-md-1 text-center">
                              <a id="mos_t" href="#"
                                   title="Mostra e esconde a página detalhada com os dados de documentos para edição.">
                                   <i class="fa fa-eye fa-2x" aria-hidden="true"></i>
                              </a>
                         </div>
                         <div class="col-md-1 text-center">
                              <a id="nov_r" href="#"
                                   title="Abre página para adicionar (criar) mais um documento dentro do sistema.">
                                   <i class="fa fa-plus-circle fa-2x" aria-hidden="true"></i>
                              </a>
                         </div>
                    </div>
                    <br />
                    <form id="frmTelMan" name="frmTelMan" action="man-frota.php" method="POST">
                         <div class="qua-2" id="tel_c">
                              <div class="row">
                                   <div class="col-md-1">
                                        <label>Número</label>
                                        <input type="text" class="form-control text-center" maxlength="6" id="cod_r"
                                             name="cod_r" value="" disabled />
                                   </div>
                                   <div class="col-md-3">
                                        <label>Nome do Funcionário</label>
                                        <select id="fun_c" name="fun_c" class="form-control">
                                             <?php $ret = carrega_col(); ?>
                                        </select>
                                   </div>
                                   <div class="col-md-2">
                                        <label>Veículo</label>
                                        <input type="text" class="form-control" maxlength="25" id="des_v" name="des_v"
                                             value="" required />
                                   </div>
                                   <div class="col-md-2">
                                        <label>Placa</label>
                                        <input type="text" class="form-control" maxlength="10" id="pla_v" name="pla_v"
                                             value="" required />
                                   </div>
                                   <div class="col-md-2">
                                        <label>Renavam</label>
                                        <input type="text" class="form-control" maxlength="15" id="ren_v" name="ren_v"
                                             value="" required />
                                   </div>
                                   <div class="col-md-2">
                                        <label>Status</label>
                                        <select id="sta_r" name="sta_r" class="form-control">
                                             <option value="0">
                                                  Normal
                                             </option>
                                             <option value="1">
                                                  Bloqueado</option>
                                             <option value="2">
                                                  Suspenso</option>
                                             <option value="3">
                                                  Cancelado</option>
                                        </select>
                                   </div>
                              </div>
                              <div class="row">
                                   <div class="col-md-2">
                                        <label>Data</label>
                                        <input type="text" class="form-control text-center" maxlength="10" id="dat_v"
                                             name="dat_v" value="<?php echo date('d/m/Y'); ?>" />
                                   </div>
                                   <div class="col-md-2">
                                        <label>Multa</label>
                                        <input type="text" class="form-control text-center" maxlength="10" id="mul_v"
                                             name="mul_v" value="" />
                                   </div>
                                   <div class="col-md-2">
                                        <label>Km Rodado</label>
                                        <input type="text" class="form-control text-center" maxlength="10" id="kil_r"
                                             name="kil_r" value="" />
                                   </div>
                                   <div class="col-md-2">
                                        <label>Tempo Parado</label>
                                        <input type="text" class="form-control text-center" maxlength="10" id="tem_p"
                                             name="tem_p" value="" />
                                   </div>
                                   <div class="col-md-2">
                                        <label>Alerta Velocidade</label>
                                        <input type="text" class="form-control text-center" maxlength="10" id="ale_v"
                                             name="ale_v" value="" />
                                   </div>
                                   <div class="col-md-2">
                                        <label>Como estou Dirigindo</label>
                                        <input type="text" class="form-control text-center" maxlength="10" id="com_d"
                                             name="com_d" value="" />
                                   </div>
                              </div>
                              <div class="row">
                                   <div class="col-md-12">
                                        <label>Observação</label>
                                        <input type="text" class="form-control" maxlength="500" id="obs_r" name="obs_r"
                                             value="" />
                                   </div>
                              </div>
                              <br />
                              <div class="row text-center">
                                   <div class="col-md-5"></div>
                                   <div class="col-md-2">
                                        <button type="button" id="sal_r" name="sal_r" class="bot-1">Salvar</button>
                                   </div>
                                   <div class="col-md-5"></div>
                              </div>
                              <br />
                         </div>
                         <br />
                         <div class="container-fluid">
                              <div id="lis_r">
                                   <div class="tab-1 table-responsive">
                                        <table id="tab-0" class="table table-sm table-striped">
                                             <thead>
                                                  <tr>
                                                       <th width="2%" class="text-center">Alterar</th>
                                                       <th width="2%" class="text-center">Excluir</th>
                                                       <th width="2%" class="text-center">Código</th>
                                                       <th>Status</th>
                                                       <th>Funcionário</th>
                                                       <th>Data</th>
                                                       <th>Veículo</th>
                                                       <th>Placa</th>
                                                       <th>Renavam</th>
                                                       <th>Multa</th>
                                                       <th>Km Rodado</th>
                                                       <th>Tempo Parado</th>
                                                  </tr>
                                             </thead>
                                             <tbody>

                                             </tbody>
                                        </table>
                                   </div>
                              </div>
                         </div>
                         <input type="hidden" id="ope_r" name="ope_r" value="1" />
                    </form>
               </div>
               <div class="row">
                    <img class="subir" src="img/subir.png" />
               </div>
          </div>
     </div>
</body>

<?php

function carrega_col() {
     $sta = 0;
     include_once "dados.php";    
     $col = (isset($_REQUEST['col']) == false ? "" : $_REQUEST['col']);
     echo '<option value="0" selected="selected">Selecione funcionário desejado ...</option>';
     $com = "Select idfuncionario, funnome from tb_funcionario order by funnome, idfuncionario";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          if ($lin['idfuncionario'] != $col) {
               echo  '<option value ="' . $lin['idfuncionario'] . '">' . $lin['funnome'] . '</option>'; 
          } else {
               echo  '<option value ="' . $lin['idfuncionario'] . '" selected="selected">' . $lin['funnome'] . '</option>';
          }
     }
     return $sta;
}

?>

</html>