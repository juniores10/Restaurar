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
     <title>Escala - Gerenciamento de Colaboradores</title>
</head>

<script>
$(function() {
     $(".hor").mask("00:00");
     $("#hri").mask("00:00");
     $("#hrf").mask("00:00");
     $("#dti").mask("00/00/0000");
     $("#dtf").mask("00/00/0000");
     $("#mes_p").mask("00/0000");
     $("#dti").datepicker($.datepicker.regional["pt-BR"]);
     $("#dtf").datepicker($.datepicker.regional["pt-BR"]);
});

$(function() {
     $('#fun_e').autocomplete({
          source: "ajax/esc-lis-funcionario.php",
          minLength: 3,
          select: function(event, ui) {
               $('#fun_c').val(ui.item.id);
          }
     });
});

$(document).ready(function() {
     if (localStorage.esc_t == undefined) {
          $('#tel_c').hide();
          localStorage.setItem('esc_t', 1);
     }

     $('#men-2').css('height', $('#men-3').height() + 'px');
     let ret = carregar_fun($('#dat_e').val(), $('#fun_c').val(), $('#loc_e').val());

     $('#tab-0').DataTable({
          "pageLength": 50,
          "aaSorting": [
               [4, 'asc'],
               [5, 'asc'],
               [2, 'asc']
          ],
          "language": {
               "lengthMenu": "Demonstrar _MENU_ linhas por páginas",
               "zeroRecords": "Não existe registros a demonstrar ...",
               "info": "Mostrada página _PAGE_ de _PAGES_",
               "infoEmpty": "Sem registros de escala ...",
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

     $("#mos_t").click(function() {
          $('#tel_c').fadeToggle();
     });

     $("#fun").change(function() {
          let ope = 2;
          let cod = $("#fun").val();
          $.getJSON("ajax/fun-car-dados.php", {
                    tip: 5,
                    ope: ope,
                    cod: cod
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#car').val(data.hor);
                         $('#hor').val(data.dia);
                         $('#hor_i').val(data.hri);
                         $('#hor_f').val(data.hrf);
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no carregamento de dados do funcionário");
               });
     });

     $("#dti").blur(function() {
          if ($("#dti").val() == "") {
               var dat = new Date;
               var ddd = ('0' + dat.getDate()).slice(-2);
               var mmm = ('0' + (dat.getMonth() + 1)).slice(-2);
               var aaa = dat.getFullYear();
               dat = ddd + "/" + mmm + "/" + (parseFloat(aaa, 10) + 5);
               $('#dti').val(dat);
          }
     });

     $("#dtf").blur(function() {
          if ($("#dti").val() != "") {
               $('#dtf').val($('#dti').val());
          } else {
               if ($("#dtf").val() == "") {
                    var dat = new Date;
                    var ddd = ('0' + dat.getDate()).slice(-2);
                    var mmm = ('0' + (dat.getMonth() + 1)).slice(-2);
                    var aaa = dat.getFullYear();
                    dat = ddd + "/" + mmm + "/" + (parseFloat(aaa, 10) + 5);
                    $('#dtf').val(dat);
               }
          }
     });

     $("#hri").blur(function() {
          if ($("#hri").val() == "") {
               $('#hri').val($('#hor_i').val());
          }
     });

     $("#hrf").blur(function() {
          if ($("#hrf").val() == "") {
               $('#hrf').val($('#hor_f').val());
          }
     });

     $("#sal_e").click(function() {
          let erro = 0;
          var ope = $('#ope_f').val();
          var cod = $('#cod_f').val();
          if (ope == 3) {
               let ret = confirm('Confirma exclusão de escala informada em tela ?');
               if (ret == true) {
                    $.getJSON("ajax/esc-del-dados.php", {
                              ope: ope,
                              cod: cod
                         })
                         .done(function(data) {
                              if (data.men != "") {
                                   alert(data.men);
                              } else {
                                   $('#loc').val(0);
                                   $('#fun').val(0);
                                   $('#dti').val('');
                                   $('#hri').val('');
                                   $('#dtf').val('');
                                   $('#hrf').val('');
                                   $('#obs').val('');
                                   $('#tip').val(0);
                                   $('#frmTelMan').submit();
                              }
                         }).fail(function(data) {
                              console.log('Erro: ' + JSON.stringify(data));
                              alert("Erro ocorrido na exclusão dados do funcionário");
                         });
               }
          }
          if ($('#loc').val() == "0") {
               alert("Local de Trabalho não pode ficar em branco no cadastro !");
               erro = 1;
          }
          if ($('#fun').val() == "0") {
               alert("Nome do funcionário não pode ficar em branco no cadastro !");
               erro = 1;
          }
          if ($('#dti').val() == "") {
               alert("Data de Início de trabalho não pode ficar em branco no cadastro !");
               erro = 1;
          }
          if ($('#dtf').val() == "") {
               alert("Data Final de trabalho não pode ficar em branco no cadastro !");
               erro = 1;
          }
          if ($('#hri').val() == "") {
               alert("Hora de Início de trabalho não pode ficar em branco no cadastro !");
               erro = 1;
          }
          if ($('#hrf').val() == "") {
               alert("Hora Final de trabalho não pode ficar em branco no cadastro !");
               erro = 1;
          }
          if (ope <= 2 && erro == 0) {
               var dad = $('#frmTelMan').serialize();
               $.post("ajax/esc-gra-dados.php", dad, function(data) {
                         if (data.men != "") {
                              alert(data.men);
                         } else {
                              $('#loc').val(0);
                              $('#fun').val(0);
                              $('#dti').val('');
                              $('#hri').val('');
                              $('#dtf').val('');
                              $('#hrf').val('');
                              $('#obs').val('');
                              $('#tip').val(0);
                              $('#frmTelMan').submit();
                         }
                    }, "json")
                    .done(function(data) {

                    }, "json")
                    .fail(function(data) {
                         console.log(JSON.stringify(data));
                         alert(
                              "Erro ocorrido na gravação de dados do registro da escala !"
                         );
                    }, "json");
          }
     });

     $("form").on("click", ".esc_h", function() {
          $('#tel_c').fadeIn();
          var ope = $(this).attr("ope");
          var cod = $(this).attr("cod");
          $('#ope_f').val(ope);
          $('#cod_f').val(cod);
          $.getJSON("ajax/esc-car-dados.php", {
                    ope: ope,
                    cod: cod
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#cod').val(data.cod);
                         $('#loc').val(data.loc);
                         $('#fun').val(data.fun);
                         $('#car').val(data.car);
                         $('#hor').val(data.hor);
                         $('#sta').val(data.sta);
                         $('#dti').val(data.dti);
                         $('#hri').val(data.hri);
                         $('#dtf').val(data.dtf);
                         $('#hrf').val(data.hrf);
                         $('#tip').val(data.tip);
                         $('#obs').val(data.obs);
                         $('#sal_e').text('Salvar');
                         if (ope == 3) {
                              $('#sal_e').text('Deletar');
                         }
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no carregamento de dados da escala");
               });
     });

     $("#edi_e").click(function() {
          $('#edi-esc').modal('show');
     });

     $("#exc_e").click(function() {
          window.open('exc-escala.php', '_self');
     });

     $("#fun_e").change(function() {
          let ret = carregar_fun($('#dat_e').val(), $('#fun_c').val(), $('#loc_e').val());
     });

     $('#dat_e').click(function() {
          $.getJSON("ajax/esc-car-funcionario.php", {
                    dat: $('#dat_e').val()
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#lis_f').html(data.txt);
                         $(".hor").mask("00:00");
                         $('#men-2').css('height', $('#men-3').height() + 'px');
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no carregamento de funcionários para escala");
               });
     });

     $("#gra_e").click(function() {
          let erro = 0;
          if ($('#loc_e').val() == "0") {
               alert("Local de Trabalho não pode ficar em inforamção no cadastro !");
               erro = 1;
          }
          if ($('#fun_c').val() == "0") {
               alert("Nome do Funcionário não pode ficar em inforamção no cadastro !");
               erro = 1;
          }
          if (erro == 0) {
               var dad = $('#frmMosEsc').serialize();
               $.post("ajax/esc-gra-tabela.php", dad, function(data) {
                         if (data.men != "") {
                              alert(data.men);
                         } else {
                              $('.hor').val('');
                              $('#edi-esc').modal('hide');
                              $('#frmTelMan').submit();
                         }
                    }, "json")
                    .done(function(data) {

                    }, "json")
                    .fail(function(data) {
                         console.log(JSON.stringify(data));
                         alert(
                              "Erro ocorrido na gravação de dados do registro da escala !"
                         );
                    }, "json");
          }
     });

     $("#pes_f").click(function() {
          $('#frmTelMan').submit();
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

     function carregar_fun(dat, fun, loc) {
          let ret = 0;
          $.getJSON("ajax/esc-car-funcionario.php", {
                    dat: dat,
                    fun: fun,
                    loc: loc
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#lis_f').html(data.txt);
                         $(".hor").mask("00:00");
                         $('#men-2').css('height', $('#men-3').height() + 'px');
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no carregamento de funcionários para escala");
               });
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

     if (isset($_SESSION['wrkmesano']) == false) { $_SESSION['wrkmesano'] = ""; }
     if (isset($_REQUEST['mes_p']) == true) { $_SESSION['wrkmesano'] = $_REQUEST['mes_p']; }

     if ($_SESSION['wrkopereg'] == 1) { 
          $_SESSION['wrkcodreg'] = ultimo_cod();
     }

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
                         <div class="col-md-8">
                              <h3 class="cor-4"><strong>Manutenção de Escalas</strong></h3>
                         </div>
                         <div class="col-md-1 text-center">
                              <a id="mos_t" href="#"
                                   title="Mostra e esconde a página detalhada com os dados de escala para edição.">
                                   <i class="fa fa-eye fa-2x" aria-hidden="true"></i>
                              </a>
                         </div>
                         <div class="col-md-1 text-center">
                              <a id="edi_e" href="#"
                                   title="Abre uma janela para informar dados da escala por Local e Funcionário para edição.">
                                   <i class="fa fa-pencil-square-o fa-2x" aria-hidden="true"></i>
                              </a>
                         </div>
                         <div class="col-md-1 text-center">
                              <a id="exc_e" href="#"
                                   title="Abre uma página para efetuar exclusão em grupo (várias) de escala de funcionários.">
                                   <i class="fa fa-trash fa-2x" aria-hidden="true"></i>
                              </a>
                         </div>
                         <div class="col-md-1 text-center">
                              <a href="man-escala.php?ope=1&cod=0"
                                   title="Abre página para adicionar (criar) mais uma escala dentro do sistema.">
                                   <i class="fa fa-plus-circle fa-2x" aria-hidden="true"></i>
                              </a>
                         </div>
                    </div>
                    <br />
                    <form id="frmTelMan" name="frmTelMan" action="man-escala.php" method="POST">
                         <div id="tel_c" class="qua-2">
                              <div class="row">
                                   <div class="col-md-1">
                                        <label>Código</label>
                                        <input type="text" class="form-control text-center" maxlength="6" id="cod"
                                             name="cod" value="<?php echo $_SESSION['wrkcodreg']; ?>" disabled />
                                   </div>
                                   <div class="col-md-3">
                                        <label>Local de Trabalho</label>
                                        <select id="loc" name="loc" class="form-control">
                                             <?php $ret = carrega_loc(); ?>
                                        </select>
                                   </div>
                                   <div class="col-md-4">
                                        <label>Nome do Funcionário</label>
                                        <select id="fun" name="fun" class="form-control">
                                             <?php $ret = carrega_col(); ?>
                                        </select>
                                   </div>
                                   <div class="col-md-1">
                                        <label>Carga Horária</label>
                                        <input type="text" class="form-control text-center" maxlength="3" id="car"
                                             name="car"
                                             value="<?php echo (isset($_REQUEST['car']) == false ? "" : $_REQUEST['car']); ?>"
                                             disabled />
                                   </div>
                                   <div class="col-md-1">
                                        <label>Horário</label>
                                        <input type="text" class="form-control text-center" maxlength="5" id="hor"
                                             name="hor"
                                             value="<?php echo (isset($_REQUEST['hor']) == false ? "" : $_REQUEST['hor']); ?>"
                                             disabled />
                                   </div>
                                   <div class="col-md-2">
                                        <label>Status</label>
                                        <select id="sta" name="sta" class="form-control">
                                             <option value="0"
                                                  <?php echo ((isset($_REQUEST['sta']) == false ? 0 : $_REQUEST['sta']) != 0 ? '' : 'selected="selected"'); ?>>
                                                  Normal
                                             </option>
                                             <option value="1"
                                                  <?php echo ((isset($_REQUEST['sta']) == false ? 0 : $_REQUEST['sta']) != 1 ? '' : 'selected="selected"'); ?>>
                                                  Bloqueado</option>
                                             <option value="2"
                                                  <?php echo ((isset($_REQUEST['sta']) == false ? 0 : $_REQUEST['sta']) != 2 ? '' : 'selected="selected"'); ?>>
                                                  Suspenso</option>
                                             <option value="3"
                                                  <?php echo ((isset($_REQUEST['sta']) == false ? 0 : $_REQUEST['sta']) != 3 ? '' : 'selected="selected"'); ?>>
                                                  Cancelado</option>
                                             <option value="4"
                                                  <?php echo ((isset($_REQUEST['sta']) == false ? 0 : $_REQUEST['sta']) != 4 ? '' : 'selected="selected"'); ?>>
                                                  Não Trabalha</option>
                                        </select>
                                   </div>
                              </div>
                              <div class="row">
                                   <div class="col-md-2"></div>
                                   <div class="col-md-2">
                                        <label>Data de Início</label>
                                        <input type="text" class="form-control text-center" maxlength="10" id="dti"
                                             name="dti"
                                             value="<?php echo (isset($_REQUEST['dti']) == false ? "" : $_REQUEST['dti']); ?>" />
                                   </div>
                                   <div class="col-md-1">
                                        <label>Hora Início</label>
                                        <input type="text" class="form-control text-center" maxlength="5" id="hri"
                                             name="hri"
                                             value="<?php echo (isset($_REQUEST['hri']) == false ? "" : $_REQUEST['hri']); ?>" />
                                   </div>
                                   <div class="col-md-2">
                                        <label>Data Final</label>
                                        <input type="text" class="form-control text-center" maxlength="10" id="dtf"
                                             name="dtf"
                                             value="<?php echo (isset($_REQUEST['dtf']) == false ? "" : $_REQUEST['dtf']); ?>" />
                                   </div>
                                   <div class="col-md-1">
                                        <label>Hora Final</label>
                                        <input type="text" class="form-control text-center" maxlength="5" id="hrf"
                                             name="hrf"
                                             value="<?php echo (isset($_REQUEST['hrf']) == false ? "" : $_REQUEST['hrf']); ?>" />
                                   </div>
                                   <div class="col-md-2">
                                        <label>Tipod de Folga</label>
                                        <select id="tip" name="tip" class="form-control">
                                             <option value="0"
                                                  <?php echo ((isset($_REQUEST['tip']) == false ? 0 : $_REQUEST['tip']) != 0 ? '' : 'selected="selected"'); ?>>
                                                  Selecione ...
                                             </option>
                                             <option value="1"
                                                  <?php echo ((isset($_REQUEST['tip']) == false ? 0 : $_REQUEST['tip']) != 1 ? '' : 'selected="selected"'); ?>>
                                                  Indefinida</option>
                                             <option value="2"
                                                  <?php echo ((isset($_REQUEST['tip']) == false ? 0 : $_REQUEST['tip']) != 2 ? '' : 'selected="selected"'); ?>>
                                                  Folga</option>
                                             <option value="3"
                                                  <?php echo ((isset($_REQUEST['tip']) == false ? 0 : $_REQUEST['tip']) != 3 ? '' : 'selected="selected"'); ?>>
                                                  Férias</option>
                                             <option value="4"
                                                  <?php echo ((isset($_REQUEST['tip']) == false ? 0 : $_REQUEST['tip']) != 4 ? '' : 'selected="selected"'); ?>>
                                                  Domingo</option>
                                             <option value="5"
                                                  <?php echo ((isset($_REQUEST['tip']) == false ? 0 : $_REQUEST['tip']) != 5 ? '' : 'selected="selected"'); ?>>
                                                  Feriado</option>
                                             <option value="6"
                                                  <?php echo ((isset($_REQUEST['tip']) == false ? 0 : $_REQUEST['tip']) != 6 ? '' : 'selected="selected"'); ?>>
                                                  Day Off</option>
                                             <option value="7"
                                                  <?php echo ((isset($_REQUEST['tip']) == false ? 0 : $_REQUEST['tip']) != 7 ? '' : 'selected="selected"'); ?>>
                                                  Licenciado</option>
                                             <option value="8"
                                                  <?php echo ((isset($_REQUEST['tip']) == false ? 0 : $_REQUEST['tip']) != 8 ? '' : 'selected="selected"'); ?>>
                                                  Home Office</option>
                                             <option value="9"
                                                  <?php echo ((isset($_REQUEST['tip']) == false ? 0 : $_REQUEST['tip']) != 9 ? '' : 'selected="selected"'); ?>>
                                                  Folga BH</option>
                                             <option value="10"
                                                  <?php echo ((isset($_REQUEST['tip']) == false ? 0 : $_REQUEST['tip']) != 10 ? '' : 'selected="selected"'); ?>>
                                                  Folga Domingo</option>
                                             <option value="11"
                                                  <?php echo ((isset($_REQUEST['tip']) == false ? 0 : $_REQUEST['tip']) != 11 ? '' : 'selected="selected"'); ?>>
                                                  Folga Feriado</option>
                                        </select>
                                   </div>
                                   <div class="col-md-2"></div>
                              </div>
                              <div class="row">
                                   <div class="col-md-12">
                                        <label>Observação</label>
                                        <input type="text" class="form-control" maxlength="500" id="obs" name="obs"
                                             value="<?php echo (isset($_REQUEST['obs']) == false ? "" : $_REQUEST['obs']); ?>" />
                                   </div>
                              </div>
                              <br />
                              <div class="row text-center">
                                   <div class="col-md-5"></div>
                                   <div class="col-md-2">
                                        <button type="button" id="sal_e" name="sal_e" <?php echo $per; ?>
                                             class="bot-1 <?php echo $del; ?>"><?php echo $bot; ?></button>
                                   </div>
                                   <div class="col-md-3"></div>
                              </div>
                         </div>
                         <br />
                         <div class="row qua-4">
                              <div class="col-md-2">
                                   <label>Local</label>
                                   <select id="loc_p" name="loc_p" class="form-control">
                                        <?php $ret = carrega_loc(); ?>
                                   </select>
                              </div>
                              <div class="col-md-2">
                                   <label>Setor</label>
                                   <select id="set_p" name="set_p" class="form-control">
                                        <?php $ret = carrega_set(); ?>
                                   </select>
                              </div>
                              <div class="col-md-2">
                                   <label>Cargo</label>
                                   <select id="car_p" name="car_p" class="form-control">
                                        <?php $ret = carrega_car(); ?>
                                   </select>
                              </div>
                              <div class="col-md-2">
                                   <label>Função</label>
                                   <select id="fun_p" name="fun_p" class="form-control">
                                        <?php $ret = carrega_fun(); ?>
                                   </select>
                              </div>
                              <div class="col-md-2">
                                   <label>Mês e Ano</label>
                                   <input type="text" class="form-control text-center" maxlength="7" id="mes_p"
                                        name="mes_p" value="<?php echo $_SESSION['wrkmesano']; ?>" />
                              </div>
                              <div class="col-md-2 text-center"><br />
                                   <button type="button" class="bot-2" id="pes_f" name="pes_f">
                                        <i class="fa fa-search fa-3x" aria-hidden="true"></i>
                                   </button>
                              </div>
                         </div>
                         <hr />
                         <div class="container-fluid">
                              <div class="row">
                                   <div class="tab-1 table-responsive">
                                        <table id="tab-0" class="table table-sm table-striped">
                                             <thead>
                                                  <tr>
                                                       <th width="2%" class="text-center">Alterar</th>
                                                       <th width="2%" class="text-center">Excluir</th>
                                                       <th width="2%" class="text-center">Número</th>
                                                       <th>Status</th>
                                                       <th>Local do Trabalho</th>
                                                       <th>Nome do Funcionário</th>
                                                       <th class="text-center">Data de Início</th>
                                                       <th class="text-center">Data Final</th>
                                                       <th>Tipo de Folga</th>
                                                       <th>Observação</th>
                                                  </tr>
                                             </thead>
                                             <tbody>
                                                  <?php $ret = carrega_esc();  ?>
                                             </tbody>
                                        </table>
                                   </div>
                              </div>
                         </div>
                         <input type="hidden" id="ope_f" value="0" />
                         <input type="hidden" id="cod_f" value="0" />
                         <input type="hidden" id="hor_i" value="" />
                         <input type="hidden" id="hor_f" value="" />
                    </form>
               </div>
          </div>
          <!------------------------------------------------------------------------------------------------------------------------------------------------------>
          <div class="modal fade" id="edi-esc" tabindex="-1" role="dialog" aria-labelledby="tel-esc" aria-hidden="true"
               data-backdrop="static">
               <div class="modal-dialog modal-xl" role="document">
                    <!-- modal-sm modal-lg modal-xl -->
                    <form id="frmMosEsc" name="frmMosEsc" action="man-escala.php" method="POST">
                         <div class="modal-content">
                              <div class="modal-header bg-primary text-white">
                                   <h5 class="modal-title" id="tel-esc">Edição de Dados da Escala</h5>
                                   <button type="button" class="close" data-dismiss="modal" aria-label="Fechar">
                                        <span aria-hidden="true">&times;</span>
                                   </button>
                              </div>
                              <div class="modal-body">
                                   <div class="form-row">
                                        <div class="col-md-5"></div>
                                        <div class="col-md-2 text-center">
                                             <label><strong>Mês de Trabalho</strong></label>
                                             <select id="dat_e" name="dat_e" class="form-control text-center">
                                                  <?php
                                                  for ($ind = 1; $ind < 13; $ind++) {
                                                       if ($ind != date('m')) {
                                                            echo '<option value="' . str_pad($ind, 2, "0", STR_PAD_LEFT) . '-' . date('Y'). '">' .  mes_ano($ind) . '/' . date('Y'). '</option>';
                                                       } else {
                                                            echo '<option value="' . str_pad($ind, 2, "0", STR_PAD_LEFT) . '-' . date('Y'). '" selected="selected">' .  mes_ano($ind) . '/' . date('Y'). '</option>';
                                                       }
                                                  }
                                             ?>
                                             </select>
                                        </div>
                                        <div class="col-md-5"></div>
                                   </div>
                                   <div class="form-row lit-6">
                                        <div class="col-md-6">
                                             <label>Local de Trabalho</label>
                                             <select id="loc_e" name="loc_e" class="form-control">
                                                  <?php $ret = carrega_loc(); ?>
                                             </select>
                                        </div>
                                        <div class="col-md-6">
                                             <label>Nome do Funcionário</label>
                                             <input type="text" class="form-control" maxlength="75" id="fun_e"
                                                  name="fun_e" value="" />
                                        </div>
                                   </div>
                                   <br />
                                   <div class="form-row">
                                        <div class="col-md-12">
                                             <div id="lis_f"></div>
                                        </div>
                                   </div>
                              </div>
                              <div class="modal-footer">
                                   <button type="button" id="gra_e" name="gra_e"
                                        class="btn btn-outline-success">Salvar</button>
                                   <button type="button" id="fec_e" name="fec_e" class="btn btn-outline-danger"
                                        data-dismiss="modal">Fechar</button>
                              </div>
                         </div>
                         <input type="hidden" id="fun_c" name="fun_c" value="0" />
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
function ultimo_cod() {
     $cod = 1;
     include_once "dados.php";
     $nro = acessa_reg('Select idescala from tb_escala order by idescala desc Limit 1', $reg);
     if ($nro == 1) {
          $cod = $reg['idescala'] + 1;
     }        
     return $cod;
}

function carrega_col() {
     $sta = 0;
     include_once "dados.php";    
     $fun = (isset($_REQUEST['fun']) == false ? "" : $_REQUEST['fun']);
     echo '<option value="0" selected="selected">Selecione funcionário ...</option>';
     $com = "Select idfuncionario, funnome from tb_funcionario order by funnome, idfuncionario";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          if ($lin['idfuncionario'] != $fun) {
               echo  '<option value ="' . $lin['idfuncionario'] . '">' . $lin['funnome'] . '</option>'; 
          } else {
               echo  '<option value ="' . $lin['idfuncionario'] . '" selected="selected">' . $lin['funnome'] . '</option>';
          }
     }
     return $sta;
}

function carrega_loc() {
     $sta = 0;
     include_once "dados.php";    
     $loc = (isset($_REQUEST['loc']) == false ? "" : $_REQUEST['loc']);
     echo '<option value="0" selected="selected">Selecione local ...</option>';
     $com = "Select idlocal, locrazao from tb_local where locstatus = 0 order by locrazao, idlocal";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          if ($lin['idlocal'] != $loc) {
               echo  '<option value ="' . $lin['idlocal'] . '">' . $lin['locrazao'] . '</option>'; 
          } else {
               echo  '<option value ="' . $lin['idlocal'] . '" selected="selected">' . $lin['locrazao'] . '</option>';
          }
     }
     return $sta;
}

function carrega_set() {
     $sta = 0;
     include_once "dados.php";    
     echo '<option value="0" selected="selected">Selecione setor ...</option>';
     $com = "Select iddados, daddescricao from tb_dados where dadtipo = 2 and dadstatus = 0 order by daddescricao, iddados";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          echo  '<option value ="' . $lin['iddados'] . '">' . $lin['daddescricao'] . '</option>'; 
     }
     return $sta;
}

function carrega_fun() {
     $sta = 0;
     include_once "dados.php";    
     echo '<option value="0" selected="selected">Selecione função ...</option>';
     $com = "Select iddados, daddescricao from tb_dados where dadtipo = 1 and dadstatus = 0 order by daddescricao, iddados";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          echo  '<option value ="' . $lin['iddados'] . '">' . $lin['daddescricao'] . '</option>'; 
     }
     return $sta;
}

function carrega_car() {
     $sta = 0;
     include_once "dados.php";    
     echo '<option value="0" selected="selected">Selecione cargo ...</option>';
     $com = "Select iddados, daddescricao from tb_dados where dadtipo = 3 and dadstatus = 0 order by daddescricao, iddados";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          echo  '<option value ="' . $lin['iddados'] . '">' . $lin['daddescricao'] . '</option>'; 
     }
     return $sta;
}

function carrega_esc() {
     $ret = 0;
     include_once "dados.php";
     $com = "Select E.*, L.locrazao, F.funnome, F.funcargo, F.funsetor, F.funfuncao from ((tb_escala E left join tb_funcionario F on E.escfuncionario = F.idfuncionario) left join tb_local L on E.esclocal = L.idlocal) where E.idescala > 0 ";
     if (isset($_REQUEST['set_p']) == true) {
          if ($_REQUEST['loc_p'] != 0) { $com .= " and E.esclocal = " . $_REQUEST['loc_p']; }
          if ($_REQUEST['set_p'] != 0) { $com .= " and F.funsetor = " . $_REQUEST['set_p']; }
          if ($_REQUEST['car_p'] != 0) { $com .= " and F.funcargo = " . $_REQUEST['car_p']; }
          if ($_REQUEST['fun_p'] != 0) { $com .= " and F.funfuncao = " . $_REQUEST['fun_p']; }
          if ($_REQUEST['mes_p'] != "") { 
               $mes_p = substr($_REQUEST['mes_p'], 3, 4) . '-' . substr($_REQUEST['mes_p'], 0, 2);
               $com .= " and date_format(E.escdata_1, '%Y-%m') = '" . $mes_p . "'";
          }
     }
     $com .= " order by F.funnome, idescala";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          $txt =  '<tr>';
          $txt .= '<td class="text-center"><a class="esc_h" href="#" ope=2 cod=' . $lin['idescala'] . ' title="Efetua alteração do registro informado na linha"><i class="large material-icons">healing</i></a></td>';
          $txt .= '<td class="text-center"><a class="esc_h" href="#" ope=3 cod=' . $lin['idescala'] . ' title="Efetua alteração do registro informado na linha"><i class="cor-1 large material-icons">delete_forever</i></a></td>';
          $txt .= '<td class="text-center">' . $lin['idescala'] . '</td>';
          if ($lin['escstatus'] == 0) {$txt .= "<td>" . "Normal" . "</td>";}
          if ($lin['escstatus'] == 1) {$txt .= "<td>" . "Bloqueado" . "</td>";}
          if ($lin['escstatus'] == 2) {$txt .= "<td>" . "Suspenso" . "</td>";}
          if ($lin['escstatus'] == 3) {$txt .= "<td>" . "Cancelado" . "</td>";}
          if ($lin['escstatus'] == 4) {$txt .= "<td>" . "Não Trabalha" . "</td>";}
          $txt .= '<td>' . $lin['locrazao'] . '</td>';
          $txt .= '<td>' . $lin['funnome'] . '</td>';          
          $txt .= '<td class="text-center">' . date('d/m/Y H:i', strtotime($lin['escdata_1'])) . '</td>';
          $txt .= '<td class="text-center">' . date('d/m/Y H:i', strtotime($lin['escdata_2'])) . '</td>';
          if ($lin['esctipo'] == 0) {$txt .= "<td>" . "" . "</td>";}
          if ($lin['esctipo'] == 1) {$txt .= "<td>" . "Indefinida" . "</td>";}
          if ($lin['esctipo'] == 2) {$txt .= "<td>" . "Folga" . "</td>";}
          if ($lin['esctipo'] == 3) {$txt .= "<td>" . "Férias" . "</td>";}
          if ($lin['esctipo'] == 4) {$txt .= "<td>" . "Domingo" . "</td>";}
          if ($lin['esctipo'] == 5) {$txt .= "<td>" . "Feriado" . "</td>";}
          if ($lin['esctipo'] == 6) {$txt .= "<td>" . "Day Off" . "</td>";}
          if ($lin['esctipo'] == 7) {$txt .= "<td>" . "Licenciado" . "</td>";}
          if ($lin['esctipo'] == 8) {$txt .= "<td>" . "Home Office" . "</td>";}
          if ($lin['esctipo'] == 9) {$txt .= "<td>" . "Folga BH" . "</td>";}
          if ($lin['esctipo'] == 10) {$txt .= "<td>" . "Folga Domingo" . "</td>";}
          if ($lin['esctipo'] == 11) {$txt .= "<td>" . "Folga Feriado" . "</td>";}
          $txt .= '<td>' . $lin['escobservacao'] . '</td>';
          $txt .= "</tr>";
          echo $txt;
     }
     return $ret;
}

?>

</html>